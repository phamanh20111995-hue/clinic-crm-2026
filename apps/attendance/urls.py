from django.urls import path
from . import views

urlpatterns = [
    # Chấm công
    path('today/', views.today_attendance, name='attendance-today'),
    path('monthly/', views.monthly_attendance, name='attendance-monthly'),
    path('sync/', views.sync_zkteco, name='attendance-sync'),
    path('manual/', views.manual_attendance, name='attendance-manual'),
    # Ca làm việc
    path('shifts/', views.ShiftListCreateView.as_view(), name='shift-list-create'),
    path('shift-assignments/', views.ShiftAssignmentListCreateView.as_view(), name='shift-assignment-list-create'),
    # Nghỉ phép
    path('leaves/', views.LeaveRequestListCreateView.as_view(), name='leave-list-create'),
    path('leaves/<int:pk>/approve/', views.approve_leave, name='leave-approve'),
]
