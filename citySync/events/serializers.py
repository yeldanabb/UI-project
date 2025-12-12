from rest_framework import serializers
from django.conf import settings
from .models import Event, Category, ContactInfo

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ContactInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInfo
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    contact_info_details = ContactInfoSerializer(source='contact_info', read_only=True)
    
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id',
            'title', 
            'description', 
            'category',           
            'category_name',      
            'category_slug',      
            'location', 
            'date', 
            'image',              
            'image_url',
            'admission',
            'external_links',          
            'contact_info',       
            'contact_info_details', 
            'created_at'
        ]
        read_only_fields = ['created_at', 'image_url', 'category_name', 'category_slug', 'contact_info_details']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None