"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"

type Team = {
  id: string
  name: string
  members: number
  project: string
  status: "active" | "pending"
}

const mockTeams: Team[] = [
  { id: "1", name: "Alpha Squad", members: 5, project: "Hackathon 2025", status: "active" },
  { id: "2", name: "Beta Builders", members: 4, project: "API Gateway", status: "active" },
  { id: "3", name: "Gamma Labs", members: 6, project: "Mobile App", status: "pending" },
  { id: "4", name: "Delta Devs", members: 3, project: "Dashboard", status: "active" },
  { id: "5", name: "Epsilon Team", members: 7, project: "Hackathon 2025", status: "active" },
  { id: "6", name: "Zeta Coders", members: 4, project: "CLI Tool", status: "pending" },
]

export default function UsersTeamsPage() {
  const columns = useMemo<ColumnDef<Team, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Team name",
        cell: (info) => info.getValue() as string,
      },
      {
        accessorKey: "members",
        header: "Members",
        cell: (info) => info.getValue() as number,
      },
      {
        accessorKey: "project",
        header: "Project",
        cell: (info) => info.getValue() as string,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const v = info.getValue() as string
          return (
            <span
              className={
                v === "active"
                  ? "text-emerald-500"
                  : "text-amber-500"
              }
            >
              {v}
            </span>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="space-y-8">
      <header>
        <h1 className="h2 text-cs-heading">Teams</h1>
        <p className="p1 mt-1 text-cs-text">View and manage teams.</p>
      </header>

      <DataTable<Team>
        columns={columns}
        data={mockTeams}
        searchMode="client"
        searchPlaceholder="Search teams..."
        pagination
        paginationConfig={{ pageSize: 5, pageSizeOptions: [5, 10, 20] }}
        sorting
        getRowId={(row) => row.id}
        emptyMessage="No teams found."
      />
    </div>
  )
}
