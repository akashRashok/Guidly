import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Guidly</h1>
          <p className="text-slate-600">Homework feedback that helps students learn</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
