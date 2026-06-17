from django.urls import path
from . import views

urlpatterns = [
    path('',                              views.AppointmentListCreateView.as_view(), name='appointment-list-create'),
    path('today/',                        views.today_appointments,                  name='appointment-today'),
    path('walkin/',                       views.walkin_create,                       name='appointment-walkin'),
    path('available-staff/',             views.available_staff,                     name='available-staff'),
    path('<int:pk>/',                     views.AppointmentDetailView.as_view(),     name='appointment-detail'),
    path('<int:pk>/checkin/',             views.checkin_view,                        name='appointment-checkin'),
    path('<int:pk>/enqueue/',             views.enqueue,                             name='appointment-enqueue'),
    path('<int:pk>/assign-room/',         views.assign_room,                         name='appointment-assign-room'),
    path('<int:pk>/to-treatment/',        views.to_treatment,                        name='appointment-to-treatment'),
    path('<int:pk>/confirm-tua/',         views.confirm_tua,                         name='appointment-confirm-tua'),
    path('<int:pk>/checkout/',            views.checkout,                            name='appointment-checkout'),
]
