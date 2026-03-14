import { useState, useEffect } from 'react';
import api from '../lib/api';
import {
    Search,
    Loader2,
    Plus,
    Trash2,
    FileText,
    Eye,
} from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { Link } from 'react-router-dom';

interface Survey {
    id: string;
    locality_name: string;
    researcher_name: string;
    created_at: string;
}

export const SurveysPage = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const fetchSurveys = async () => {
        try {
            const response = await api.get('/admin/surveys');
            setSurveys(response.data);
        } catch (error) {
            console.error('Failed to fetch surveys', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSurveys(); }, []);

    // --- Walkthrough Sections ---
    // ### 3. Survey View & Management
    // - **Detailed View**: Click the **Eye icon** on any survey in the list to open a full report. This view elegantly displays every single piece of data from the 7-step form, including political analysis, infrastructure ratings, and social charts.
    // - **Delete Option**: Use the **Trash icon** to remove any old or incorrect survey entries with a simple confirmation prompt.
    //
    // ### 4. Backend & Security
    // - **JSONB Storage**: The survey data is stored in a flexible `JSONB` format in PostgreSQL, ensuring that even complex nested data is preserved perfectly.
    // - **Researcher Association**: Every survey is automatically linked to the Admin/Worker who submitted it.
    // --- End Walkthrough Sections ---

    const handleDeleteSurvey = async (id: string) => {
        if (!confirm('Are you sure you want to delete this survey?')) return;
        try {
            await api.delete(`/admin/surveys/${id}`);
            fetchSurveys();
        } catch (error) {
            alert('Failed to delete survey');
        }
    };

    const filteredSurveys = surveys.filter(s => 
        s.locality_name.toLowerCase().includes(search.toLowerCase()) || 
        s.researcher_name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalItems = filteredSurveys.length;
    const paginatedSurveys = filteredSurveys.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Surveys</h1>
                        <p className="text-slate-500 text-sm">Qualitative Assessment of Localities</p>
                    </div>
                    <Link
                        to="/surveys/add"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="w-5 h-5" />
                        New Survey
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by locality or researcher..."
                            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-shrink bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Locality</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Researcher</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Submitted At</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right bg-slate-50">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedSurveys.map((survey) => (
                                <tr key={survey.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-900">{survey.locality_name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{survey.researcher_name || 'Admin'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">
                                        {new Date(survey.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/surveys/${survey.id}`}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteSurvey(survey.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Survey"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && paginatedSurveys.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                        No surveys found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>
        </div>
    );
};
