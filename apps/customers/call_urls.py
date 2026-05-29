from django.urls import path
from . import call_views

urlpatterns = [
    path('queue/',                          call_views.TeleQueueView.as_view(),  name='call-queue'),
    path('',                               call_views.log_call,                  name='call-log'),
    path('return-request/',                call_views.create_return_request,     name='return-request-create'),
    path('return-requests/',               call_views.ReturnRequestListView.as_view(), name='return-request-list'),
    path('return-request/<int:pk>/approve/', call_views.review_return_request,   name='return-request-review'),
]
