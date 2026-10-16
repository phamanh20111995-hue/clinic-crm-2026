from django.utils import timezone

DEFAULT_CARE = (1, 14, 21)

def get_care_rule(service=None):
    from .models import CareRule
    rule = None
    if service is not None:
        rule = CareRule.objects.filter(service=service).first()
    if rule is None:
        rule = CareRule.objects.filter(service__isnull=True).first()
    if rule is None:
        return DEFAULT_CARE
    return (rule.care_days, rule.rebook_days, rule.risk_days)

def courses(customer):
    return list(customer.treatment_courses.filter(is_deleted=False).select_related('service', 'contract'))

def get_buoi_con_lai(customer):
    return sum(c.buoi_con_lai for c in courses(customer))

def last_session(customer):
    from apps.contracts.models import TreatmentSession
    return (TreatmentSession.objects
            .filter(course__customer=customer, is_deleted=False, date__isnull=False)
            .select_related('course', 'course__service')
            .order_by('-date').first())

def compute_care_flag(customer, today=None):
    if today is None:
        today = timezone.localdate()
    cs = customer.care_status
    remain = get_buoi_con_lai(customer)

    sess = last_session(customer)
    last_treat = sess.date if sess else None
    svc = sess.course.service if sess else None
    care_d, book_d, risk_d = get_care_rule(svc)
    note = (customer.note_entries
            .filter(channel='cham_soc', is_deleted=False)
            .order_by('-created_at').first())
    last_care = timezone.localtime(note.created_at).date() if note else None
    days = (today - last_treat).days if last_treat else None
    has_upcoming = (customer.appointments
                    .filter(scheduled_at__date__gte=today)
                    .exclude(status='cancelled').exists())
    has_missed = (customer.appointments
                  .filter(scheduled_at__date__lt=today, status='pending')
                  .exists())
    cared_after_treat = (last_treat is not None and last_care is not None and last_care >= last_treat)

    # Khieu nai - uu tien cao nhat
    if cs == 'khieu_nai':
        return {'kind': 'complaint', 'label': 'Xu ly khieu nai gap'}

    # Tam dung - moi quay lai lam tiep
    if cs == 'tam_dung':
        return {'kind': 'winback', 'label': 'Moi quay lai lam tiep'}

    # Ngung/bo - con buoi thi moi lam not, het buoi thi dong
    if cs == 'ngung':
        if remain > 0:
            return {'kind': 'winback', 'label': f'Moi lam not ({remain} buoi)'}
        return {'kind': 'muted', 'label': 'Khong nhac'}

    # Hoan thanh (xong goi) - D+1 goi danh gia + moi mua, goi xong thi thoi
    if cs == 'hoan_thanh':
        if days is not None and care_d <= days <= care_d + 1 and not cared_after_treat:
            return {'kind': 'review', 'label': 'Danh gia + moi mua tiep'}
        return {'kind': 'muted', 'label': 'Khong nhac'}

    # Hen quay lai - dung cot Ngay hen
    if cs == 'hen_quay_lai':
        if has_upcoming:
            return {'kind': 'wait', 'label': 'Cho den hen'}
        return {'kind': 'callback', 'label': 'Goi theo hen'}

    # Dang theo lieu trinh - nhip chuan
    if has_missed and not has_upcoming:
        return {'kind': 'missed', 'label': 'Lo hen - goi lai'}
    if has_upcoming:
        return {'kind': 'ok', 'label': 'Da co lich'}
    if days is not None and care_d <= days <= care_d + 1 and not cared_after_treat:
        return {'kind': 'care', 'label': f'Goi cham soc ({days}d)'}
    if remain > 0 and days is not None and days >= risk_d:
        return {'kind': 'risk', 'label': f'Qua han {days}d'}
    if remain > 0 and days is not None and days >= book_d:
        return {'kind': 'book', 'label': 'Nhac dat lich'}
    if 0 < remain <= 2:
        return {'kind': 'low', 'label': f'Sap het goi ({remain})'}
    return {'kind': 'ok', 'label': 'OK'}
