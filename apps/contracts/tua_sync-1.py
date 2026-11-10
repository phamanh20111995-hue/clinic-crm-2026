"""Dong bo chia tua cho 1 buoi (Appointment) theo nguoi dang gan — maker-checker 2 lop.
Goi tu: checkout (tao lan dau) va updateAppointment khi doi nguoi tren buoi da check-out."""

# (role TuaAllocation, field tren Appointment)
# BS tu van / BS dieu tri / KTV: co tien tua theo dich vu.
# SALE: van theo doi (tiep tua) de biet sale nao, nhung KHONG tinh tien (ho an doanh so) -> amount=0.
ROLE_FIELDS = [
    ('BS_TU_VAN', 'doctor'),
    ('BS_DIEU_TRI', 'bs_dieu_tri'),
    ('KTV', 'ktv'),
    ('SALE', 'sale'),
]
NO_MONEY_ROLES = {'SALE'}


def _notify(user, title, body, data=None):
    try:
        from apps.chat.notifications import send_notification
        send_notification(user, 'general', title, body=body, data=data or {})
    except Exception:
        pass


def sync_tua_allocations(appt, actor=None):
    """Dong bo TuaAllocation theo doctor/bs_dieu_tri/ktv/sale hien tai cua buoi.
    - Nguoi moi  -> tao dong 'cho_xac_nhan' + thong bao.
    - Doi nguoi  -> dong nguoi cu -> 'huy' + thong bao; nguoi moi -> dong moi.
    - Go nguoi   -> dong -> 'huy' + thong bao.
    KHONG dung so tua cua dong da co (de giu xac nhan); chi sua so qua endpoint edit."""
    from .models import TuaAllocation
    default_amount, svc_name = 0, ''
    if appt.service_id:
        try:
            default_amount = int(appt.service.tua_rate or 0)
            svc_name = appt.service.name
        except Exception:
            pass
    khach = (appt.customer.full_name if appt.customer_id else '') or ''
    created, cancelled = 0, 0

    for role, field in ROLE_FIELDS:
        uid = getattr(appt, field + '_id', None)
        qs = TuaAllocation.objects.filter(appointment=appt, role=role)
        role_label = dict(TuaAllocation.ROLE_CHOICES)[role]
        if uid:
            # Huy cac dong cung role nhung khac nguoi (chia nham -> chia lai)
            for a in qs.exclude(user_id=uid).exclude(status='huy'):
                a.status = 'huy'
                a.save(update_fields=['status'])
                cancelled += 1
                _notify(a.user, 'Tua đã hủy',
                        f'Phần tua {role_label} buổi "{khach}" đã được điều chỉnh/hủy.',
                        {'appointment': appt.id})
            # Dong cho nguoi hien tai — Sale khong tinh tien (amount=0)
            amt = 0 if role in NO_MONEY_ROLES else default_amount
            alloc = qs.filter(user_id=uid).first()
            if alloc is None:
                alloc = TuaAllocation.objects.create(
                    appointment=appt, user_id=uid, role=role,
                    service_name=svc_name, amount=amt,
                    status='cho_xac_nhan', created_by=actor,
                )
                created += 1
                money_txt = f' ({svc_name}): {amt:,.0f}đ' if role not in NO_MONEY_ROLES else ''
                _notify(alloc.user, 'Xác nhận tua',
                        f'Bạn được chia tua {role_label} buổi "{khach}"{money_txt}. Vui lòng xác nhận.',
                        {'appointment': appt.id, 'tua_id': alloc.id})
            elif alloc.status == 'huy':
                # Chia lai dung nguoi cu da tung bi huy
                alloc.status = 'cho_xac_nhan'
                alloc.save(update_fields=['status'])
                _notify(alloc.user, 'Xác nhận tua',
                        f'Bạn được chia lại tua {role_label} buổi "{khach}". Vui lòng xác nhận.',
                        {'appointment': appt.id, 'tua_id': alloc.id})
        else:
            # Khong con ai o role nay -> huy het dong dang active
            for a in qs.exclude(status='huy'):
                a.status = 'huy'
                a.save(update_fields=['status'])
                cancelled += 1
                _notify(a.user, 'Tua đã hủy',
                        f'Phần tua {role_label} buổi "{khach}" đã bị gỡ.',
                        {'appointment': appt.id})

    return {'created': created, 'cancelled': cancelled}
