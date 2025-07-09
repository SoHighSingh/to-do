"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface CreateListFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateListForm({ onSuccess, onCancel }: CreateListFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const utils = api.useUtils();

  const createListMutation = api.todo.createList.useMutation({
    onSuccess: () => {
      void utils.todo.getAllLists.invalidate();
      setTitle("");
      setDescription("");
      setErrors({});
      onSuccess();
    },
    onError: (error) => {
      // Handle validation errors
      if (error.data?.zodError) {
        const zodErrors: { title?: string; description?: string } = {};
        error.data.zodError.fieldErrors.title?.forEach((err) => {
          zodErrors.title = err;
        });
        error.data.zodError.fieldErrors.description?.forEach((err) => {
          zodErrors.description = err;
        });
        setErrors(zodErrors);
      } else {
        setErrors({ title: error.message });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    createListMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="rounded-lg bg-white/30 p-6">
      <h3 className="text-lg font-semibold mb-4">Create New To-do List</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            List Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-3 py-2 rounded bg-white/20 border ${
              errors.title ? "border-red-500" : "border-white/30"
            } focus:outline-none focus:border-white/50`}
            placeholder="Enter list title..."
            maxLength={100}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3 py-2 rounded bg-white/20 border ${
              errors.description ? "border-red-500" : "border-white/30"
            } focus:outline-none focus:border-white/50 resize-none`}
            placeholder="Enter description..."
            rows={3}
            maxLength={500}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
          <p className="text-xs text-gray-600 mt-1">
            {description.length}/500 characters
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createListMutation.isPending || !title.trim()}
            className="flex-1 py-2 bg-green-500/50 text-white rounded hover:bg-green-500/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createListMutation.isPending ? "Creating..." : "Create List"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-500/50 text-white rounded hover:bg-gray-500/70"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}