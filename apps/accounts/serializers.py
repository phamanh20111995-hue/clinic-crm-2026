from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, Clinic, ROLE_CHOICES


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT login — nhúng thêm role + display_name vào token."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['display_name'] = user.display_name
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'display_name': self.user.display_name,
            'role': self.user.role,
            'role_display': self.user.get_role_display(),
            'avatar': self.user.avatar.url if self.user.avatar else None,
        }
        return data


class UserListSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'display_name', 'first_name', 'last_name',
            'phone', 'role', 'role_display', 'avatar', 'is_active', 'created_at',
        ]


class UserDetailSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'display_name', 'first_name', 'last_name',
            'phone', 'role', 'role_display', 'avatar', 'is_active',
            'is_staff', 'date_joined', 'created_at',
        ]
        read_only_fields = ['id', 'date_joined', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'phone', 'role', 'password', 'password_confirm',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Mật khẩu không khớp.'})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'avatar', 'role', 'is_active']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Mật khẩu cũ không đúng.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'Mật khẩu mới không khớp.'})
        return attrs


class ClinicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = '__all__'
