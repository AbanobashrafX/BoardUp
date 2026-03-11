from apps.task.models import Category, Task
from rest_framework import serializers


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "color"]
        read_only_fields = ["id"]


class TaskSerializer(serializers.ModelSerializer):
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
            "due_date",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TaskMoveSerializer(serializers.Serializer):
    """Serializer for moving tasks between columns"""

    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)
    position = serializers.IntegerField(required=False, min_value=0)
