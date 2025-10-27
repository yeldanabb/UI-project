from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, CategoryViewSet, ContactInfoViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'contact', ContactInfoViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]