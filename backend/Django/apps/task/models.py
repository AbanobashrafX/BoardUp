from django.db import models


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(BaseModel):
    """
    Category model for organizing tasks
    """

    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default="#3498db")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"


class Task(BaseModel):
    """
    Kanban Task model
    Represents a task in the task management system.
    """

    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
        ("URGENT", "Urgent"),
    ]

    STATUS_CHOICES = [
        ("TODO", "To Do"),
        ("IN_PROGRESS", "In Progress"),
        ("DONE", "Done"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks"
    )
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="MEDIUM"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="TODO")
    position = models.IntegerField(default=0)

    # TASK dates
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["status", "position", "-created_at"]
        verbose_name = "Task"
        verbose_name_plural = "Tasks"

    def __str__(self):
        return self.title

    @property
    def subtasks_count(self):
        return self.subtasks.count()

    @property
    def completed_subtasks_count(self):
        return self.subtasks.filter(is_completed=True).count()


class Subtask(BaseModel):
    """
    Subtask model for checklist items within a task
    """

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="subtasks")
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    position = models.IntegerField(default=0)

    class Meta:
        ordering = ["position", "created_at"]
        verbose_name = "Subtask"
        verbose_name_plural = "Subtasks"

    def __str__(self):
        return f"{self.title} ({'completed' if self.is_completed else 'pending'})"
