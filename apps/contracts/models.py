from django.db import models
from django.conf import settings
class Contract(models.Model):
    contract_no = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='contracts')
    appointment = models.ForeignKey('appointments.Appointment', null=True, blank=True, on_delete=models.SET_NULL)
    clinic = models.ForeignKey('accounts.Clinic', null=True, blank=True, on_delete=models.SET_NULL, related_name='contracts')
    # Nguoi ban (duoc tinh doanh thu) - mac dinh = nguoi tao, chon tay khi le tan/KT nhap ho
    nguoi_ban = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='sold_contracts')
    items = models.JSONField(default=list)
    promotions = models.JSONField(default=list)
    gifts = models.JSONField(default=list)
    total_amount = models.DecimalField(max_digits=15, decimal_places=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    final_amount = models.DecimalField(max_digits=15, decimal_places=0)
    PAYMENT_METHOD_CHOICES = [('cash','Tiền mặt'),('transfer','Chuyển khoản'),('combined','Kết hợp'),('card','Thẻ'),('installment','Trả góp')]
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    cash_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    transfer_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    # Tra gop luc tao HD: phan nha tai tro ganh (principal) + thong tin de vat chat hoa luc duyet
    installment_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Phan tra gop (goc nha tai tro ganh) khi tao HD')
    installment_info = models.JSONField(default=dict, blank=True, help_text='provider, ref_no, phi, ben chiu... de tao Installment luc duyet')
    # The/QR (VNPAY): tinh thuc thu NGAY luc quet, PK chiu phi, net ve bank T+1 (quet so du)
    card_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Tien khach quet the (gross) khi tao HD')
    card_info = models.JSONField(default=dict, blank=True, help_text='provider (VNPAY), fee (phi PK chiu), ref (ma GD)')
    PAYMENT_STATUS_CHOICES = [('pending','Chưa nhận'),('received','Đã nhận'),('partial','Nhận một phần')]
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    APPROVAL_STATUS_CHOICES = [('draft','Nháp'),('pending_kt','Chờ KT duyệt'),('approved','Đã duyệt'),('rejected','Từ chối')]
    approval_status = models.CharField(max_length=15, choices=APPROVAL_STATUS_CHOICES, default='draft')
    SALE_ROUND_CHOICES = [('sale', 'Sale (vòng 1)'), ('upsale', 'Upsale (vòng 2+)')]
    sale_round = models.CharField(max_length=10, choices=SALE_ROUND_CHOICES, default='sale')
    so_buoi = models.PositiveIntegerField(default=0, help_text='Tong so buoi lieu trinh mua')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_contracts')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_contracts')
    approved_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    class Meta: verbose_name='Hợp đồng'; ordering=['-created_at']
    def __str__(self): return f'{self.contract_no} — {self.customer}'

class TreatmentCourse(models.Model):
    """Lieu trinh theo tung dich vu, sinh ra khi chot HD."""
    contract = models.ForeignKey('Contract', on_delete=models.CASCADE, related_name='courses')
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='treatment_courses')
    service = models.ForeignKey('services.Service', on_delete=models.PROTECT, related_name='courses')
    so_buoi = models.PositiveIntegerField(default=0, help_text='Tong so buoi mua cho dich vu nay')
    note = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Lieu trinh'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.customer} - {self.service} ({self.so_buoi} buoi)'

    @property
    def so_buoi_da_dung(self):
        return self.sessions.filter(is_deleted=False).count()

    @property
    def buoi_con_lai(self):
        return max(0, self.so_buoi - self.so_buoi_da_dung)


class TreatmentSession(models.Model):
    """Tung buoi thuc hien lieu trinh."""
    course = models.ForeignKey('TreatmentCourse', on_delete=models.CASCADE, related_name='sessions')
    appointment = models.ForeignKey('appointments.Appointment', null=True, blank=True, on_delete=models.SET_NULL, related_name='treatment_sessions')
    date = models.DateField(null=True, blank=True)
    ktv = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='treatment_sessions')
    notes = models.TextField(blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Buoi dieu tri'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'Buoi {self.date} - {self.course}'


class Payment(models.Model):
    """Mot lan thu tien cho hop dong. 1 HD co the co nhieu Payment (tra gop)."""
    contract = models.ForeignKey('Contract', on_delete=models.CASCADE, related_name='payments')
    total = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Tong lan thu = tien mat + chuyen khoan + the + tra gop')
    cash_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    transfer_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    card_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Quet the/QR (VNPAY) - tinh thuc thu ngay')
    card_fee = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Phi VNPAY PK chiu (gross - net)')
    card_ref = models.CharField(max_length=50, blank=True, help_text='Ma GD VNPAY de doi soat')
    card_settled = models.BooleanField(default=False, help_text='The: net da ve bank chua (quet so du) - cho doi soat')
    card_settled_at = models.DateField(null=True, blank=True, help_text='Ngay tien the thuc ve bank')
    installment_amount = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Phan tra gop qua don vi tai chinh')
    received_at = models.DateField(null=True, blank=True)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments_received')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    VERIFY_STATUS_CHOICES = [
        ('cho_xac_nhan', 'Chờ xác nhận'),
        ('da_xac_nhan', 'Đã xác nhận'),
        ('lech', 'Lệch - cần sửa'),
    ]
    verify_status = models.CharField(max_length=15, choices=VERIFY_STATUS_CHOICES, default='cho_xac_nhan')
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='payments_verified')
    verified_at = models.DateTimeField(null=True, blank=True)
    verify_note = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Phieu thu tien'
        ordering = ['-received_at', '-created_at']

    def __str__(self):
        return f'{self.contract.contract_no} - {self.total}'

    @property
    def is_installment_settled(self):
        """True neu khong co tra gop, hoac tat ca khoan tra gop da ve ket."""
        insts = list(self.installments.all())
        return all(i.status == 'da_ve' for i in insts) if insts else True

    @property
    def settled_total(self):
        """KHACH DA TRA (gross): TM + CK + The luon tinh (the quet la thu ngay); tra gop chi tinh khi da giai ngan.
        Day la so cho CONG NO (con no = doanh thu - khach da tra). Phi KHONG tru o day."""
        base = int(self.cash_amount) + int(self.transfer_amount) + int(self.card_amount)
        if self.is_installment_settled:
            base += int(self.installment_amount)
        return base

    @property
    def fee_total(self):
        """Phi PK chiu da phat sinh (phi the VNPAY + phi tra gop da giai ngan). = chi phi PK, khong dung doanh thu."""
        fee = int(self.card_fee)
        for i in self.installments.all():
            if i.status == 'da_ve':
                fee += int(i.fee_pk)
        return fee

    @property
    def net_settled(self):
        """TIEN THUC VE KET/BANK = khach da tra (gross) - phi."""
        return self.settled_total - self.fee_total

    @property
    def card_net(self):
        """Tien the thuc ve bank sau phi VNPAY (gross - phi)."""
        return int(self.card_amount) - int(self.card_fee)

    @property
    def pending_total(self):
        """Tien tra gop DANG CHO giai ngan (chua ve ket)."""
        return 0 if self.is_installment_settled else int(self.installment_amount)


class Installment(models.Model):
    """Chi tiet phan tra gop cua mot Payment: nha tai tro, phi chuyen doi, lai, giai ngan."""
    PROVIDER_TYPE_CHOICES = [
        ('vay_tieu_dung', 'Vay tiêu dùng'),
        ('the_tin_dung', 'Thẻ tín dụng'),
    ]
    BEARER_CHOICES = [
        ('pk', 'Phòng khám chịu'),
        ('khach', 'Khách chịu'),
        ('chia', 'Chia'),
    ]
    STATUS_CHOICES = [
        ('cho_duyet', 'Chờ duyệt hồ sơ'),
        ('cho_giai_ngan', 'Chờ giải ngân'),
        ('da_ve', 'Đã giải ngân'),
    ]
    payment = models.ForeignKey('Payment', on_delete=models.CASCADE, related_name='installments')
    provider = models.CharField(max_length=100, help_text='Home Credit / FE Credit / VNPAY...')
    ref_no = models.CharField(max_length=50, blank=True, help_text='So HD tra gop / ma GD de doi soat')
    provider_type = models.CharField(max_length=20, choices=PROVIDER_TYPE_CHOICES, default='vay_tieu_dung')
    principal = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Goc - khau tru no khach')
    conversion_fee = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Phi chuyen doi')
    fee_bearer = models.CharField(max_length=10, choices=BEARER_CHOICES, default='khach')
    fee_pk = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    fee_khach = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    interest = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Lai tra gop')
    interest_bearer = models.CharField(max_length=10, choices=BEARER_CHOICES, default='khach')
    interest_pk = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Lai PK chiu (hoan khach)')
    interest_khach = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    pk_net = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='PK thuc nhan')
    pk_cost = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Chi phi PK = fee_pk + interest_pk')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='cho_giai_ngan')
    expected_date = models.DateField(null=True, blank=True, help_text='Ngay du kien ve ket (T+1 tru T6/7/CN)')
    actual_date = models.DateField(null=True, blank=True, help_text='Ngay thuc ve ket')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Khoan tra gop'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.provider} - {self.principal}'


class ContractCredit(models.Model):
    """Quy doanh thu HD cho tung nguoi theo vai tro (snapshot bat bien luc duyet HD).
    KHONG chua % chia (them sau o man Luong). BS/KTV khong vao day (da co o TreatmentSession)."""
    ROLE_CHOICES = [
        ('SALE', 'Sale'), ('TELE', 'Tele'), ('CSKH', 'CSKH'),
        ('ADS', 'Marketing/Ads'), ('TRUC_PAGE', 'Truc page'),
        ('BS', 'Bac si'), ('KTV', 'KTV'),
    ]
    contract = models.ForeignKey('Contract', on_delete=models.CASCADE, related_name='credits')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='revenue_credits')
    role = models.CharField(max_length=15, choices=ROLE_CHOICES)
    clinic = models.ForeignKey('accounts.Clinic', null=True, blank=True, on_delete=models.SET_NULL)
    region = models.CharField(max_length=20, blank=True, help_text='Snapshot mien luc duyet HD')
    share_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='Dien sau o man Luong')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['contract', 'user', 'role']
        verbose_name = 'Quy doanh thu HD'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.contract.contract_no} - {self.get_role_display()} - {self.user}'


class CashReconciliation(models.Model):
    """Doi soat ket tien mat cuoi ngay theo co so: so sach (tong TM ghi CRM) vs tien dem thuc."""
    clinic = models.ForeignKey('accounts.Clinic', null=True, blank=True, on_delete=models.SET_NULL, related_name='cash_recons')
    date = models.DateField(help_text='Ngay doi soat')
    so_sach = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Tong TM ghi trong CRM (snapshot luc chot)')
    tien_dem = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='Tien mat thuc dem trong ket')
    lech = models.DecimalField(max_digits=15, decimal_places=0, default=0, help_text='tien_dem - so_sach (am = thieu ket)')
    counted_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='cash_recons')
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['clinic', 'date']
        verbose_name = 'Doi soat ket TM'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'Ket {self.date} - lech {self.lech}'


# ===== DE XUAT CHI + DUYET NHIEU TANG + SO QUY (cum "tien ra") =====

EXPENSE_OWNER_THRESHOLD = 1_000_000  # >= muc nay phai them Chu DN duyet

# Loai chi -> (role nguoi duyet dau tien, nhan hien thi)
EXPENSE_FIRST_APPROVER = {
    'tele':  ('LEAD_TELE', 'Lead Tele'),
    'mkt':   ('LEAD_MKT',  'Lead MKT'),
    'cskh':  ('LEAD_CSKH', 'Lead CSKH'),
    'sale':  ('LEAD_SALE', 'Lead Sale'),
    # con lai (co_so / vat_tu / van_phong_pham / hoa_don_vat / luong_ung / khac) -> QL chi nhanh
}


def build_expense_chain(category, amount, requester_role=None):
    """Tra ve chuoi duyet [{step_order, role, label}] theo loai chi + so tien.
    Tang 1 = truong bo phan theo loai; Tang 2 = Ke toan; Tang 3 = Chu DN (khi >= 1 trieu).
    BO buoc ma chinh nguoi de xuat phai ky (khong tu duyet cho minh): vd Lead tu de xuat ->
    bo buoc truong bo phan, chi con Ke toan (+ Chu DN neu >= 1 trieu)."""
    first_role, first_name = EXPENSE_FIRST_APPROVER.get(category, ('QUAN_LY', 'QL chi nhánh'))
    raw = [
        {'role': first_role, 'label': f'Trưởng bộ phận ({first_name})'},
        {'role': 'KE_TOAN', 'label': 'Kế toán'},
    ]
    try:
        amt = int(amount or 0)
    except (TypeError, ValueError):
        amt = 0
    if amt >= EXPENSE_OWNER_THRESHOLD:
        raw.append({'role': 'CHU_DN', 'label': 'Chủ DN'})
    if requester_role:
        raw = [s for s in raw if s['role'] != requester_role]
    return [{'step_order': i + 1, 'role': s['role'], 'label': s['label']} for i, s in enumerate(raw)]


class ExpenseRequest(models.Model):
    """De xuat chi cua cac bo phan: tao -> duyet nhieu tang theo han muc -> chi -> ghi so quy chi."""
    CATEGORY_CHOICES = [
        ('co_so', 'Chi phí cơ sở / chi nhánh'),
        ('vat_tu', 'Vật tư / thuốc'),
        ('van_phong_pham', 'Văn phòng phẩm'),
        ('tele', 'Tele / Data'),
        ('mkt', 'Marketing'),
        ('cskh', 'CSKH'),
        ('sale', 'Sale'),
        ('hoa_don_vat', 'Lấy hóa đơn VAT về công ty'),
        ('luong_ung', 'Tạm ứng / lương'),
        ('khac', 'Khác'),
    ]
    PAYMENT_METHOD_CHOICES = [('cash', 'Tiền mặt'), ('transfer', 'Chuyển khoản'), ('installment', 'Trả góp')]
    STATUS_CHOICES = [
        ('cho_duyet', 'Chờ duyệt'),
        ('da_duyet', 'Đã duyệt - chờ chi'),
        ('da_chi', 'Đã chi'),
        ('tu_choi', 'Từ chối'),
    ]
    code = models.CharField(max_length=20, unique=True, help_text='Ma phieu de xuat chi, vd DXC-0001')
    clinic = models.ForeignKey('accounts.Clinic', null=True, blank=True, on_delete=models.SET_NULL, related_name='expense_requests')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='khac')
    title = models.CharField(max_length=200, help_text='Noi dung chi')
    reason = models.TextField(blank=True, help_text='Ly do / dien giai chi tiet')
    amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    payment_method = models.CharField(max_length=15, choices=PAYMENT_METHOD_CHOICES, default='cash', help_text='De xuat chi bang TM / CK / Tra gop')
    co_hoa_don_vat = models.BooleanField(default=False, help_text='Co hoa don VAT dau vao (de doi soat MISA)')
    # Mua tra gop (PK tra dan hang thang): so ky + ngay ky dau -> sinh lich ExpensePayout khi duyet xong
    so_ky = models.PositiveIntegerField(default=0, help_text='So ky tra gop (chi khi payment_method=installment)')
    ky_dau = models.DateField(null=True, blank=True, help_text='Ngay ky tra dau tien')
    chung_tu = models.JSONField(default=list, blank=True, help_text='Danh sach anh/URL chung tu dinh kem')
    chung_tu_note = models.CharField(max_length=255, blank=True, help_text='Mo ta chung tu neu chua upload anh')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='cho_duyet')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='expense_requests')
    # Chi (payout) khi da duyet xong
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='expenses_paid')
    paid_at = models.DateField(null=True, blank=True)
    paid_method = models.CharField(max_length=15, choices=PAYMENT_METHOD_CHOICES, blank=True, help_text='Thuc te chi TM/CK')
    paid_note = models.TextField(blank=True)
    # Tu choi
    reject_reason = models.TextField(blank=True)
    rejected_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='expenses_rejected')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'De xuat chi'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} - {self.title} ({self.amount})'

    @property
    def current_step(self):
        """Buoc dang cho ky dau tien (status='cho'), hoac None neu xong/tu choi."""
        return self.approvals.filter(status='cho').order_by('step_order').first()

    @property
    def is_fully_approved(self):
        steps = list(self.approvals.all())
        return bool(steps) and all(s.status == 'duyet' for s in steps)

    @property
    def is_installment(self):
        return self.payment_method == 'installment'

    @property
    def paid_amount(self):
        """So tien da chi thuc te. Tra gop = tong cac ky da chi; chi 1 lan = amount khi da_chi."""
        if self.is_installment:
            return int(sum(p.amount for p in self.payouts.filter(status='da_chi')))
        return int(self.amount) if self.status == 'da_chi' else 0

    @property
    def remaining(self):
        """Con phai tra (dung cho tra gop)."""
        return int(self.amount) - self.paid_amount


class ExpensePayout(models.Model):
    """Mot ky chi cua de xuat mua TRA GOP (PK tra dan). Chi 1 lan -> khong dung bang nay."""
    STATUS_CHOICES = [('cho_chi', 'Chờ chi'), ('da_chi', 'Đã chi')]
    METHOD_CHOICES = [('cash', 'Tiền mặt'), ('transfer', 'Chuyển khoản')]
    request = models.ForeignKey('ExpenseRequest', on_delete=models.CASCADE, related_name='payouts')
    ky_no = models.PositiveIntegerField(default=1, help_text='Ky thu may')
    due_date = models.DateField(null=True, blank=True, help_text='Ngay den han ky nay')
    amount = models.DecimalField(max_digits=15, decimal_places=0, default=0)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default='transfer')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='cho_chi')
    paid_at = models.DateField(null=True, blank=True)
    paid_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='expense_payouts_paid')
    note = models.TextField(blank=True)

    class Meta:
        unique_together = ['request', 'ky_no']
        verbose_name = 'Ky tra gop chi'
        ordering = ['ky_no']

    def __str__(self):
        return f'{self.request.code} - ky {self.ky_no}/{self.request.so_ky} ({self.amount})'


class ExpenseApproval(models.Model):
    """Mot buoc ky trong chuoi duyet cua mot de xuat chi. Ky TUAN TU theo step_order."""
    STATUS_CHOICES = [
        ('cho', 'Chờ'),
        ('duyet', 'Đã duyệt'),
        ('tu_choi', 'Từ chối'),
    ]
    request = models.ForeignKey('ExpenseRequest', on_delete=models.CASCADE, related_name='approvals')
    step_order = models.PositiveIntegerField(default=1)
    role = models.CharField(max_length=20, help_text='Role code nguoi phai ky buoc nay')
    label = models.CharField(max_length=80, help_text='Nhan hien thi, vd Truong bo phan / Ke toan / Chu DN')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='expense_approvals')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='cho')
    acted_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        unique_together = ['request', 'step_order']
        verbose_name = 'Buoc duyet chi'
        ordering = ['step_order']

    def __str__(self):
        return f'{self.request.code} - B{self.step_order} {self.label} [{self.status}]'
