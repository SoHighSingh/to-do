"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import TodoListCard from "./TodoListCard";
import CreateListForm from "./CreateListForm";

// Type definitions to match your Prisma schema
interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  todoListId: string;
}

interface TodoList {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  todoItems: TodoItem[];
}

export default function TodoListsContainer() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Fetch all todo lists
  const queryResult = api.todo.getAllLists.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const todoLists = queryResult.data as TodoList[] | undefined;
  const isLoading = queryResult.isLoading;
  const error = queryResult.error as Error | null;

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl rounded-lg bg-white/20 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-white/10 rounded"></div>
            <div className="h-20 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl rounded-lg bg-red-100 p-6">
        <p className="text-red-600">Error loading todo lists: {error.message}</p>
      </div>
    );
  }

  const handleListClick = (listId: string) => {
    setSelectedListId(selectedListId === listId ? null : listId);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const todoListsData = todoLists ?? [];

  return (
    <div className="w-full max-w-4xl space-y-4">

      {/* Create form */}
      {showCreateForm && (
        <CreateListForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Todo Lists */}
      {todoListsData.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {todoListsData.map((list) => (
            <TodoListCard
              key={list.id}
              list={list}
              isExpanded={selectedListId === list.id}
              onClick={() => handleListClick(list.id)}
            />
          ))}
          {!showCreateForm && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-full bg-white/50 px-6 py-2 font-semibold transition hover:bg-white/30"
              >
                + Create list
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-white/20 p-8 text-center">
          <p className="text-gray-600 mb-4">You don&apos;t have any todo lists yet.</p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-full bg-white/50 px-6 py-2 font-semibold transition hover:bg-white/30"
            >
              + Create your first list
            </button>
          )}
        </div>
      )}
    </div>
  );
}