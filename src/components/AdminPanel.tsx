import React, { useState } from "react";
import { INITIAL_PROBLEMS } from "../constants";
import { Plus, Edit, Trash2, Users, Settings } from "lucide-react";

export default function AdminPanel() {
  const [problems, setProblems] = useState(INITIAL_PROBLEMS);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-[#6B7280]">Manage problems, users, and platform settings.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-2xl font-bold hover:bg-[#4338CA] transition-all shadow-lg shadow-indigo-100">
          <Plus size={20} />
          Add New Problem
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-bold">1,284</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <Settings size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Problems</p>
            <p className="text-2xl font-bold">{problems.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5E7EB]">
          <h3 className="font-bold">Problem Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] text-[#6B7280] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Difficulty</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4 font-medium">{problem.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280]">{problem.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
