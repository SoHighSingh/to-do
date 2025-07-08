import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const todoRouter = createTRPCRouter({
  getAllLists: protectedProcedure.query(async ({ ctx }) => {
    try {
      const lists = await ctx.db.todoList.findMany({
        where: { createdById: ctx.session.user.id },
        include: {
          todoItems: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      
      // Ensure we always return an array, even if empty
      return lists ?? [];
    } catch (error) {
      console.error("Error fetching todo lists:", error);
      return [];
    }
  }),

  createList: protectedProcedure
    .input(z.object({
      title: z.string().min(1, "List Title is Required").max(100, "Title is too long"),
      description: z.string().max(500, "Description is too long").optional(),
    }))
    .mutation(async ({ ctx, input}) => {
      return ctx.db.todoList.create({
        data: {
          title: input.title,
          description: input.description,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
        include: {
          todoItems: true,
        },
      });
    }),

  deleteList: protectedProcedure
    .input(z.object({ listId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this list
      const list = await ctx.db.todoList.findFirst({
        where: { 
          id: input.listId,
          createdById: ctx.session.user.id,
        },
      });

      if (!list) {
        throw new Error("List not found or you don't have permission");
      }

      return ctx.db.todoList.delete({
        where: { id: input.listId },
      });
    }),
  
    // Add item to a specific list
  addItem: protectedProcedure
    .input(z.object({
      listId: z.string(),
      title: z.string().min(1, "Item Title is Required").max(200, "Title is too long"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this list
      const list = await ctx.db.todoList.findFirst({
        where: { 
          id: input.listId,
          createdById: ctx.session.user.id,
        },
      });

      if (!list) {
        throw new Error("List not found or you don't have permission");
      }

      return ctx.db.todoItem.create({
        data: {
          title: input.title,
          todoListId: input.listId,
        },
      });
    }),

  // Toggle item completion status
  toggleItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First get the item to check ownership
      const item = await ctx.db.todoItem.findFirst({
        where: { id: input.itemId },
        include: {
          todoList: true, // Include the list to check ownership
        },
      });

      if (!item || item.todoList.createdById !== ctx.session.user.id) {
        throw new Error("Item not found or you don't have permission");
      }

      return ctx.db.todoItem.update({
        where: { id: input.itemId },
        data: { completed: !item.completed }, // Toggle the completion status
      });
    }),

  // Delete a todo item
  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through the list
      const item = await ctx.db.todoItem.findFirst({
        where: { id: input.itemId },
        include: {
          todoList: true,
        },
      });

      if (!item || item.todoList.createdById !== ctx.session.user.id) {
        throw new Error("Item not found or you don't have permission");
      }

      return ctx.db.todoItem.delete({
        where: { id: input.itemId },
      });
    }),
})