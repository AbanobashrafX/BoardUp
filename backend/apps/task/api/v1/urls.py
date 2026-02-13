from django.urls import path

from .views import (
    CategoryDetail,
    CategoryList,
    TaskByStatus,
    TaskDetail,
    TaskList,
    TaskMove,
    api_root,
)

urlpatterns = [
    path("", api_root, name="api-root"),
    path("categories/", CategoryList, name="category-list"),
    path("categories/<int:pk>/", CategoryDetail, name="category-detail"),
    path("tasks/", TaskList, name="task-list"),
    path("tasks/by_status/", TaskByStatus, name="task-by-status"),
    path("tasks/<int:pk>/", TaskDetail, name="task-detail"),
    path("tasks/<int:pk>/move/", TaskMove, name="task-move"),
    path("tasks/<str:status>/", TaskByStatus, name="task-by-status-single"),
]
