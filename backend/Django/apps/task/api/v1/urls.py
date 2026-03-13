from django.urls import path

from .views import (
    APIRoot,
    CategoryDetail,
    CategoryList,
    SubtaskDetail,
    SubtaskList,
    TaskByStatus,
    TaskDetail,
    TaskList,
    TaskMove,
)

urlpatterns = [
    path("", APIRoot, name="api-root"),
    path("categories/", CategoryList, name="category-list"),
    path("categories/<int:pk>/", CategoryDetail, name="category-detail"),
    path("tasks/", TaskList, name="task-list"),
    path("tasks/<int:pk>/", TaskDetail, name="task-detail"),
    path("tasks/<int:pk>/move/", TaskMove, name="task-move"),
    path("tasks/<str:status>/", TaskByStatus, name="task-by-status"),
    # Subtask endpoints (2 endpoints: list/create and detail/update/delete)
    path("tasks/<int:task_pk>/subtasks/", SubtaskList, name="subtask-list"),
    path("subtasks/<int:pk>/", SubtaskDetail, name="subtask-detail"),
]
