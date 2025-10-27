from django.contrib import admin
from .models import Event, Category, ContactInfo

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'location', 'date', 'contact_info', 'admission']
    list_filter = ['category', 'date']
    search_fields = ['title', 'description']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']

@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ['address', 'phone', 'email']