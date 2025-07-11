"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

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

interface TodoListCardProps {
  list: TodoList;
  isExpanded: boolean;
  onClick: () => void;
}

export default function TodoListCard({ list, isExpanded, onClick }: TodoListCardProps) {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  const utils = api.useUtils();

  // Mutations
  const addItemMutation = api.todo.addItem.useMutation({
    onSuccess: () => {
      void utils.todo.getAllLists.invalidate();
      setNewItemTitle("");
      setIsAddingItem(false);
    },
  });

  const toggleItemMutation = api.todo.toggleItem.useMutation({
    onSuccess: () => {
      void utils.todo.getAllLists.invalidate();
    },
  });

  const deleteItemMutation = api.todo.deleteItem.useMutation({
    onSuccess: () => {
      void utils.todo.getAllLists.invalidate();
    },
  });

  const deleteListMutation = api.todo.deleteList.useMutation({
    onSuccess: () => {
      void utils.todo.getAllLists.invalidate();
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemTitle.trim()) {
      addItemMutation.mutate({
        listId: list.id,
        title: newItemTitle.trim(),
      });
    }
  };

  const handleToggleItem = (itemId: string) => {
    toggleItemMutation.mutate({ itemId });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate({ itemId });
    }
  };

  const handleDeleteList = () => {
    if (confirm("Are you sure you want to delete this entire list? This cannot be undone.")) {
      deleteListMutation.mutate({ listId: list.id });
    }
  };

  const completedCount = list.todoItems.filter(item => item.completed).length;
  const totalCount = list.todoItems.length;

  return (
    <div className="rounded-lg bg-white/20 p-4 transition-all hover:bg-white/25">
      {/* List Header */}
      <div 
        className="cursor-pointer flex items-center justify-between"
        onClick={onClick}
      >
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{list.title}</h3>
          {list.description && (
            <p className="text-sm text-gray-600 mt-1">{list.description}</p>
          )}
          <div className="flex items-center gap-5 mt-3 text-sm text-gray-600">
            <span>{totalCount} items</span>
            <span>{completedCount}/{totalCount} completed</span>
            <span>{new Date(list.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteList();
            }}
            className="w-full py-2 text-center text-gray-600 px-2 hover:text-gray-700 cursor-pointer"
            disabled={deleteListMutation.isPending}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
          <span className="text-gray-400">
            {isExpanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="mt-3 space-y-3">
          {/* Todo Items */}
          {list.todoItems.length > 0 ? (
            <div className="space-y-2">
              {list.todoItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded bg-white/10"
                >
                  <button
                    onClick={() => handleToggleItem(item.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                      item.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-400 hover:border-gray-600"
                    }`}
                    disabled={toggleItemMutation.isPending}
                  >
                    {item.completed && "✓"}
                  </button>
                  
                  <span
                    className={`flex-1 ${
                      item.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {item.title}
                  </span>
                  
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm px-2 hover:font-bold cursor-pointer"
                    disabled={deleteItemMutation.isPending}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No items yet</p>
          )}

          {/* Add Item Form */}
          {isAddingItem ? (
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Enter item title..."
                className="w-52 px-3 py-2 rounded bg-white/20 border border-white/30 focus:outline-none focus:border-white/50"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newItemTitle.trim() || addItemMutation.isPending}
                className="px-4 py-2 bg-green-500/50 text-white rounded hover:bg-green-500/70 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItemTitle("");
                }}
                className="px-4 py-2 bg-gray-500/50 text-white rounded hover:bg-gray-500/70"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingItem(true)}
              className="w-full py-2 text-center text-gray-600 hover:text-gray-800 border-2 border-dashed border-gray-400 hover:border-gray-600 rounded cursor-pointer"
            >
              + Add item
            </button>
          )}
        </div>
      </div>
    </div>
  );
}