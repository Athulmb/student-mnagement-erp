'use client';

import React from 'react';
import { FileText, Download, BookOpen, ExternalLink, Code2, FolderGit2 } from 'lucide-react';
import { StudentLayout } from '@/components/student/student-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudentMaterialsPage() {
  const materials = [
    {
      title: 'Academy Student Handbook & Code of Conduct',
      type: 'PDF Document',
      size: '2.4 MB',
      description: 'Orientation manual, academic policies, evaluation rubric, and grading scale.',
    },
    {
      title: 'Lecture Slides & Code Snippets Archive',
      type: 'ZIP Bundle',
      size: '48.1 MB',
      description: 'Comprehensive slides, lab exercise starters, and instructor reference implementations.',
    },
    {
      title: 'Capstone Project Guidelines & Defense Rubric',
      type: 'PDF Document',
      size: '1.8 MB',
      description: 'Requirements for designing, building, and deploying your production enterprise capstone.',
    },
    {
      title: 'Recommended Technical Books & Industry Resources',
      type: 'Resource Link',
      size: 'External',
      description: 'Curated list of documentation, architecture guides, and recommended reading.',
    },
  ];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Study Materials & Resources
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Access lecture guides, repository starters, reading lists, and lab instructions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materials.map((item, idx) => (
            <Card key={idx} className="p-6 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-400">{item.size}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                <Button size="sm" variant="outline" className="text-xs gap-1.5 text-slate-700">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download File</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}
