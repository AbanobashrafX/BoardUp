from apps.task.models import Category, Project, Subtask, Task
from rest_framework import serializers


class ProjectSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()
    total_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "color",
            "icon",
            "is_active",
            "tasks_count",
            "completed_tasks_count",
            "total_tasks_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_tasks_count(self, obj):
        return obj.tasks_count

    def get_completed_tasks_count(self, obj):
        return obj.completed_tasks_count

    def get_total_tasks_count(self, obj):
        # Get total task count from context (set by the view)
        return self.context.get("total_tasks_count", 0)


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = [
            "id",
            "task",
            "title",
            "is_completed",
            "position",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "task", "created_at", "updated_at"]


class SubtaskCreateSerializer(serializers.Serializer):
    """Serializer for creating subtasks"""

    title = serializers.CharField(max_length=255)
    is_completed = serializers.BooleanField(required=False, default=False)


class SubtaskUpdateSerializer(serializers.Serializer):
    """Serializer for updating subtasks"""

    title = serializers.CharField(max_length=255, required=False)
    is_completed = serializers.BooleanField(required=False)
    position = serializers.IntegerField(required=False, min_value=0)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "color"]
        read_only_fields = ["id"]


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_color = serializers.CharField(source="project.color", read_only=True)
    subtasks = SubtaskSerializer(many=True, read_only=True)
    subtasks_count = serializers.IntegerField(read_only=True)
    completed_subtasks_count = serializers.IntegerField(read_only=True)
    due_date = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "project",
            "project_name",
            "project_color",
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
            "subtasks",
            "subtasks_count",
            "completed_subtasks_count",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "title": {"required": True},
            "description": {"required": False, "allow_null": True, "allow_blank": True},
            "project": {"required": False, "allow_null": True},
            "category": {"required": False, "allow_null": True},
            "priority": {"required": False},
            "status": {"required": False},
            "position": {"required": False},
            "due_date": {"required": False, "allow_null": True},
            "completed_at": {"required": False, "allow_null": True},
        }

    def validate_due_date(self, value):
        """Handle empty string as null for due_date"""
        if value == "" or value is None:
            return None
        return value

    def to_internal_value(self, data):
        # Handle empty string for due_date
        if data.get("due_date") == "":
            data = data.copy()
            data["due_date"] = None
        return super().to_internal_value(data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if ret.get("due_date"):
            ret["due_date"] = (
                instance.due_date.strftime("%Y-%m-%d") if instance.due_date else None
            )
        return ret


class TaskMoveSerializer(serializers.Serializer):
    """Serializer for moving tasks between columns"""

    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES)
    position = serializers.IntegerField(required=False, min_value=0)
