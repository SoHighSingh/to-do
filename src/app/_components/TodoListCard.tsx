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

  // Mutations with optimistic updates
  const addItemMutation = api.todo.addItem.useMutation({
    onMutate: async ({ listId, title }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await utils.todo.getAllLists.cancel();

      // Get current data
      const previousLists = utils.todo.getAllLists.getData();

      // Create optimistic item
      const optimisticItem: TodoItem = {
        id: `temp-${Date.now()}`, // Temporary ID
        title: title,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        todoListId: listId,
      };

      // Optimistically update the cache
      utils.todo.getAllLists.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        
        return oldData.map(todoList => 
          todoList.id === listId 
            ? { ...todoList, todoItems: [...todoList.todoItems, optimisticItem] }
            : todoList
        );
      });

      // Return context for rollback
      return { previousLists };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLists) {
        utils.todo.getAllLists.setData(undefined, context.previousLists);
      }
    },
    onSuccess: () => {
      setNewItemTitle("");
      setIsAddingItem(false);
    },
    onSettled: () => {
      // Always refetch after mutation settles
      void utils.todo.getAllLists.invalidate();
    },
  });

  const toggleItemMutation = api.todo.toggleItem.useMutation({
    onMutate: async ({ itemId }) => {
      await utils.todo.getAllLists.cancel();

      const previousLists = utils.todo.getAllLists.getData();

      // Optimistically toggle the item
      utils.todo.getAllLists.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        
        return oldData.map(todoList => ({
          ...todoList,
          todoItems: todoList.todoItems.map(item => 
            item.id === itemId 
              ? { ...item, completed: !item.completed, updatedAt: new Date() }
              : item
          )
        }));
      });

      return { previousLists };
    },
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        utils.todo.getAllLists.setData(undefined, context.previousLists);
      }
    },
    onSettled: () => {
      void utils.todo.getAllLists.invalidate();
    },
  });

  const deleteItemMutation = api.todo.deleteItem.useMutation({
    onMutate: async ({ itemId }) => {
      await utils.todo.getAllLists.cancel();

      const previousLists = utils.todo.getAllLists.getData();

      // Optimistically remove the item
      utils.todo.getAllLists.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        
        return oldData.map(todoList => ({
          ...todoList,
          todoItems: todoList.todoItems.filter(item => item.id !== itemId)
        }));
      });

      return { previousLists };
    },
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        utils.todo.getAllLists.setData(undefined, context.previousLists);
      }
    },
    onSettled: () => {
      void utils.todo.getAllLists.invalidate();
    },
  });

  const deleteListMutation = api.todo.deleteList.useMutation({
    onMutate: async ({ listId }) => {
      await utils.todo.getAllLists.cancel();

      const previousLists = utils.todo.getAllLists.getData();

      // Optimistically remove the list
      utils.todo.getAllLists.setData(undefined, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter(todoList => todoList.id !== listId);
      });

      return { previousLists };
    },
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        utils.todo.getAllLists.setData(undefined, context.previousLists);
      }
    },
    onSettled: () => {
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
    <div className="w-90 rounded-lg bg-white/20 p-4 transition-all hover:bg-white/25">
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
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
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
          <span className="text-gray-400 transition-transform duration-300 ease-in-out">
            {isExpanded ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} />}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      <div 
        className={`transition-all duration-400 ease-in-out overflow-hidden ${
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
                className="flex-1 px-3 py-2 rounded bg-white/20 border border-white/30 focus:outline-none focus:border-white/50"
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