'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CaretLeft, CaretRight, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { useState } from 'react';

interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title: string;
    searchPlaceholder?: string;
    onAdd?: () => void;
    addButtonLabel?: string;
    isLoading?: boolean;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    title,
    searchPlaceholder = 'Search...',
    onAdd,
    addButtonLabel = 'Add New',
    isLoading = false,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter data based on search
    const filteredData = data.filter((item) =>
        Object.values(item).some((value) =>
            String(value).toLowerCase().includes(search.toLowerCase())
        )
    );

    // Pagination
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    const getValue = (item: T, key: string): unknown => {
        if (key.includes('.')) {
            return key.split('.').reduce((obj, k) => (obj as Record<string, unknown>)?.[k], item as unknown);
        }
        return (item as Record<string, unknown>)[key];
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-[#1F1F1F]">{title}</h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <MagnifyingGlass
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696C70]"
                        />
                        <Input
                            type="search"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64 pl-10 rounded-xl border-[#E9E9E9] bg-white"
                        />
                    </div>
                    {onAdd && (
                        <Button
                            onClick={onAdd}
                            className="rounded-xl bg-[#1F1F1F] text-white hover:bg-[#D2EF9A] hover:text-[#1F1F1F]"
                        >
                            <Plus size={18} className="mr-2" />
                            {addButtonLabel}
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#E9E9E9] bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-[#F7F7F7] hover:bg-[#F7F7F7]">
                            {columns.map((column) => (
                                <TableHead
                                    key={String(column.key)}
                                    className="text-[#696C70] font-semibold py-4"
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1F1F1F] border-t-transparent" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-[#696C70]"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((item) => (
                                <TableRow key={item.id} className="hover:bg-[#F7F7F7]">
                                    {columns.map((column) => (
                                        <TableCell key={String(column.key)} className="py-4">
                                            {column.render
                                                ? column.render(item)
                                                : String(getValue(item, String(column.key)) ?? '')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#696C70]">
                    <span>Rows per page:</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                            setPageSize(Number(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-20 h-9 rounded-lg border-[#E9E9E9]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[#696C70]">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg border-[#E9E9E9]"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <CaretLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg border-[#E9E9E9]"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            <CaretRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
