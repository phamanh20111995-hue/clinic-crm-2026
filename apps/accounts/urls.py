from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # JWT Auth
    path('login/',           views.LoginView.as_view(),         name='auth-login'),
    path('logout/',          views.logout_view,                  name='auth-logout'),
    path('refresh/',         TokenRefreshView.as_view(),         name='auth-refresh'),

    # User info
    path('me/',              views.me_view,                      name='auth-me'),
    path('roles/',           views.roles_view,                   name='auth-roles'),
    path('change-password/', views.change_password_view,         name='auth-change-password'),

    # User management (Management only)
    path('users-lite/', views.users_lite, name='user-lite'),
    path('users/',           views.UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/',  views.UserDetailView.as_view(),     name='user-detail'),

    # Clinics
    path('clinics/',         views.ClinicListView.as_view(),     name='clinic-list'),
]
