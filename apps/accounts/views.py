from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, Clinic, ROLE_CHOICES
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserListSerializer, UserDetailSerializer,
    UserCreateSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, ClinicSerializer,
)
from .permissions import CanManageUsers


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/"""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """POST /api/auth/logout/ — blacklist refresh token."""
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response(
            {'detail': 'Refresh token là bắt buộc.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError:
        return Response({'detail': 'Token không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'detail': 'Đăng xuất thành công.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """GET /api/auth/me/ — thông tin user đang đăng nhập."""
    return Response(UserDetailSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def roles_view(request):
    """GET /api/auth/roles/ — danh sách roles."""
    return Response([{'value': v, 'label': l} for v, l in ROLE_CHOICES])


class UserListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/auth/users/ — Chỉ Management."""
    permission_classes = [IsAuthenticated, CanManageUsers]

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        return qs

    def get_serializer_class(self):
        return UserCreateSerializer if self.request.method == 'POST' else UserListSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/auth/users/{id}/"""
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, CanManageUsers]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserDetailSerializer

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {'detail': 'Không thể vô hiệu hoá chính mình.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Soft delete — chỉ vô hiệu hoá, không xóa cứng
        user.is_active = False
        user.save()
        return Response({'detail': 'Đã vô hiệu hoá tài khoản.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """POST /api/auth/change-password/"""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save()
    return Response({'detail': 'Đổi mật khẩu thành công.'})


class ClinicListView(generics.ListAPIView):
    """GET /api/auth/clinics/ — danh sách phòng khám."""
    queryset = Clinic.objects.filter(is_active=True)
    serializer_class = ClinicSerializer
    permission_classes = [IsAuthenticated]
