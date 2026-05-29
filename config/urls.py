from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/', include('apps.accounts.urls')),

    # Apps (Sprint 2+)
    path('api/customers/', include('apps.customers.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/contracts/', include('apps.contracts.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/salary/', include('apps.salary.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/kpi/', include('apps.kpi.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
