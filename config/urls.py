from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',         include('apps.accounts.urls')),
    path('api/customers/',    include('apps.customers.urls')),
    path('api/calls/',        include('apps.customers.call_urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/rooms/',        include('apps.clinics.urls')),
    path('api/contracts/',    include('apps.contracts.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/attendance/',   include('apps.attendance.urls')),
    path('api/salary/',       include('apps.salary.urls')),
    path('api/chat/',         include('apps.chat.urls')),
    path('api/kpi/',          include('apps.kpi.urls')),
    path('api/integrations/', include('apps.integrations.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
