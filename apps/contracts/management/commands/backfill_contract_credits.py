from django.core.management.base import BaseCommand
from django.db import transaction
from apps.contracts.models import Contract, ContractCredit


class Command(BaseCommand):
    help = 'Backfill ContractCredit cho cac HD da duyet (tu gan hien tai cua Customer).'

    def handle(self, *args, **opts):
        qs = (Contract.objects
              .filter(is_deleted=False, approval_status='approved')
              .select_related('customer', 'created_by', 'appointment', 'appointment__room', 'clinic'))
        n_hd = 0
        n_credit = 0
        for ct in qs:
            n_hd += 1
            with transaction.atomic():
                # suy co so tu lich hen -> phong -> clinic
                if ct.clinic_id is None and ct.appointment_id:
                    room = getattr(ct.appointment, 'room', None)
                    if room and room.clinic_id:
                        ct.clinic_id = room.clinic_id
                        ct.save(update_fields=['clinic'])
                region = ct.clinic.region if ct.clinic_id else ''
                cus = ct.customer
                sale_uid = cus.sale_id
                if not sale_uid and ct.created_by_id and getattr(ct.created_by, 'role', None) in ('SALE', 'LEAD_SALE'):
                    sale_uid = ct.created_by_id
                cmap = [
                    ('SALE', sale_uid), ('TELE', cus.tele_id), ('CSKH', cus.cskh_id),
                    ('ADS', cus.ads_id),
                    # Quy uoc: nguoi TAO data chinh la truc page
                    ('TRUC_PAGE', getattr(cus, 'truc_page_id', None) or cus.created_by_id),
                ]
                for role, uid in cmap:
                    if uid:
                        _, created = ContractCredit.objects.get_or_create(
                            contract=ct, user_id=uid, role=role,
                            defaults={'clinic_id': ct.clinic_id, 'region': region},
                        )
                        if created:
                            n_credit += 1
        self.stdout.write(self.style.SUCCESS(
            f'Xu ly {n_hd} HD da duyet, tao moi {n_credit} dong ContractCredit.'))
