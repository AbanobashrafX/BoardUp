from rest_framework import serializers

from apps.task.models import Category, Task


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""

    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "color", "task_count"]
        read_only_fields = ["id"]

    def get_task_count(self, obj):
        """Get count of tasks in this category"""
        return obj.tasks.count()


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "category",
            "category_name",
            "category_color",
            "priority",
            "status",
            "position",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks"""

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "category",
            "priority",
            "status",
            "position",
        ]
        read_only_fields = ["id"]


class TaskMoveSerializer(serializers.Serializer):
    """Serializer for moving tasks between columns"""

    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)
    position = serializers.IntegerField(required=False, min_value=0)
