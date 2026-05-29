from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Room
from .serializers import RoomSerializer


class RoomListView(generics.ListAPIView):
    """
    GET /api/rooms/
    Danh sách phòng + trạng thái hiện tại (sơ đồ phòng Lễ tân).
    Query: clinic_id, room_type, is_active
    """
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Room.objects.select_related('clinic').filter(is_active=True)
        p = self.request.query_params
        if p.get('clinic_id'): qs = qs.filter(clinic_id=p['clinic_id'])
        if p.get('room_type'): qs = qs.filter(room_type=p['room_type'])
        return qs.order_by('clinic', 'name')
