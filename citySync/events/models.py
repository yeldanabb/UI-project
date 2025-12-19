from django.db import models

class Category(models.Model):
    # This table stores event categories
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    
    class Meta:
        verbose_name_plural = "Categories"
    
    def __str__(self):
        return self.name
    
class ContactInfo(models.Model):
    # 2. This table stores contact information
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    
    
    class Meta:
        verbose_name_plural = "Contact Information"
    
    def __str__(self):
        if self.email:
            return f"{self.phone} - {self.email}"
        return f"{self.phone} - {self.address[:30]}..."

class Event(models.Model):
    # This is the main table for all your events
    title = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='events',blank=True)
    location = models.CharField(max_length=200, blank=True)
    date = models.CharField(max_length=100, blank=True)
    image = models.ImageField(upload_to='events/', blank=True, null=True)
    admission = models.TextField(default="Free admission")
    external_links = models.URLField(blank=True)
    contact_info = models.ForeignKey(
        ContactInfo, 
        on_delete=models.SET_NULL, 
        blank=True, 
        null=True,
        related_name='events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

