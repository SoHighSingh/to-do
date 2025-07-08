import Link from "next/link";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import TodoListsContainer from "./_components/TodoListsContainer";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    // Prefetch the todo lists for better performance
    void api.todo.getAllLists.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#f7ebab] to-[#ffc054] text-[#383838]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          
          {/* Different headings based on auth status */}
          {session?.user ? (
            // Signed-in user view
            <>
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
                Your <span className="text-[hsl(33,100.00%,60.20%)]">To-Do Lists</span>
              </h1>
              
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-2xl text-black">
                  Welcome back, {session.user?.name}!
                </p>
                
                {/* Todo Lists Container */}
                <TodoListsContainer />
                
                <Link
                  href="/api/auth/signout"
                  className="rounded-full bg-white/50 px-10 py-3 font-semibold transition hover:bg-white/30"
                >
                  Sign Out
                </Link>
              </div>
            </>
          ) : (
            // Signed-out user view
            <>
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
                Create your <span className="text-[hsl(33,100.00%,60.20%)]">To-Do List</span>.
              </h1>
              
              <div className="flex flex-col items-center gap-2">
                <p className="text-2xl text-[#383838]">Get Started</p>

                <div className="flex flex-col items-center justify-center gap-4">
                  <Link
                    href="/api/auth/signin"
                    className="rounded-full bg-white/50 px-10 py-3 font-semibold transition hover:bg-white/30"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}