from rest_framework import viewsets, permissions
from .models import Event, Category, ContactInfo
from .serializers import EventSerializer, CategorySerializer, ContactInfoSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all() # Fetches all categories from the database
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny] # Allows anyone to see or edit (no login required)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]  
    
    def get_queryset(self):
        """
        Overrides the default query to add filtering by category slug.
        """
        queryset = Event.objects.all().select_related('category')
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset
    
    def get_serializer_context(self):
        return {'request': self.request}

"""
    Simple viewset for managing contact details like address, phone, and email.
    """
class ContactInfoViewSet(viewsets.ModelViewSet):
    queryset = ContactInfo.objects.all()
    serializer_class = ContactInfoSerializer
    permission_classes = [permissions.AllowAny]