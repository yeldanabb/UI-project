from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, CategoryViewSet, ContactInfoViewSet

# Create a router object to automatically generate URL patterns
router = DefaultRouter()
# This maps the URL prefix (e.g., 'events') to the logic in EventViewSet
router.register(r'events', EventViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'contact', ContactInfoViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]