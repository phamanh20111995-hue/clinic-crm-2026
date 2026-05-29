"""
Custom permission classes theo CLAUDE.md.
RBAC: KHÔNG dùng Django built-in permissions.
"""
from rest_framework.permissions import BasePermission
from .models import FULL_ACCESS_ROLES, MANAGEMENT_ROLES, LEAD_ROLES


class IsManagement(BasePermission):
    """QUAN_LY hoặc CHU_DN."""
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in MANAGEMENT_ROLES)


class IsLeadOrAbove(BasePermission):
    """Lead* hoặc Management."""
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in LEAD_ROLES)


class HasFullCustomerAccess(BasePermission):
    """
    Full 5-tab access hồ sơ KH.
    SALE chỉ xem KH của mình → dùng queryset filter, không dùng permission này.
    TELE, MKT, DATA, TRUC_PAGE → bị chặn.
    """
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in FULL_ACCESS_ROLES)


class IsSale(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role == 'SALE')


class IsTele(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role == 'TELE')


class IsLeadTele(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in ('LEAD_TELE', 'QUAN_LY', 'CHU_DN'))


class IsKeToan(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in ('KE_TOAN', 'QUAN_LY', 'CHU_DN'))


class IsLeTan(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in ('LE_TAN', 'QUAN_LY', 'CHU_DN'))


class IsCSKH(BasePermission):
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in ('CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN'))


class CanManageUsers(BasePermission):
    """Chỉ Quản lý / Chủ DN tạo, sửa, vô hiệu hoá user."""
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role in MANAGEMENT_ROLES)
