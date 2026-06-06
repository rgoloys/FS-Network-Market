from rest_framework.permissions import BasePermission

from .models import UserProfile


class IsBusinessUser(BasePermission):
    message = 'Business dashboard access is required.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile.role == UserProfile.ROLE_BUSINESS_ADMIN
