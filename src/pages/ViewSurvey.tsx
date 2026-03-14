import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
    ArrowLeft,
    Loader2,
    MapPin,
    User,
    Calendar,
    Building2,
    Users,
    Zap,
    TrendingUp,
    FileText,
} from 'lucide-react';

export const ViewSurveyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [survey, setSurvey] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                const response = await api.get(`/admin/surveys/${id}`);
                setSurvey(response.data);
            } catch (error) {
                console.error('Failed to fetch survey', error);
                alert('Survey not found');
                navigate('/surveys');
            } finally {
                setLoading(false);
            }
        };
        fetchSurvey();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const data = survey.survey_data;

    return (
        <div className="h-full flex flex-col space-y-6 max-w-5xl mx-auto pb-10 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex-shrink-0 flex items-center justify-between">
                <button onClick={() => navigate('/surveys')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Surveys
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                        Reference: {survey.id.slice(0, 8)}
                    </span>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <MapPin className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{survey.locality_name}</h1>
                            <p className="text-slate-500 font-medium uppercase tracking-wider text-xs">{data.areaType} Area</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 border-l border-slate-200 pl-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Researcher</p>
                            <div className="flex items-center gap-2 text-slate-700">
                                <User className="w-4 h-4 text-indigo-500" />
                                <span className="font-semibold">{survey.researcher_name || 'Admin'}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Submitted On</p>
                            <div className="flex items-center gap-2 text-slate-700">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <span className="font-semibold">{new Date(survey.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Political Analysis */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900">Political Overview</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Strongest Party (सबसे मजबूत पार्टी)</p>
                            <p className="text-lg font-bold text-indigo-900">{data.strongestParty || 'N/A'}</p>
                            <p className="mt-3 text-sm text-indigo-700 leading-relaxed italic">"{data.strongestPartyReason}"</p>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-slate-400 uppercase">Party Organization Strength</p>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(data.partyStrength || {}).map(([party, rating]: [any, any]) => (
                                    <div key={party} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{party}</p>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            rating === 'good' ? 'bg-green-100 text-green-700' : 
                                            rating === 'average' ? 'bg-yellow-100 text-yellow-700' : 
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {rating === 'good' ? 'अच्छी' : rating === 'average' ? 'औसत' : 'खराब'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Figures Table */}
                <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-700">Influential Figures (प्रमुख व्यक्ति)</p>
                    <div className="overflow-hidden border border-slate-100 rounded-2xl">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-slate-500 font-bold uppercase text-[10px]">
                                    <th className="p-4 text-left">Name</th>
                                    <th className="p-4 text-left">Community</th>
                                    <th className="p-4 text-left">Mobile</th>
                                    <th className="p-4 text-left">Leaning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.keyFigures?.map((fig: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-semibold text-slate-900">{fig.name}</td>
                                        <td className="p-4 text-slate-600">{fig.community}</td>
                                        <td className="p-4 text-slate-600 font-mono tracking-tighter">{fig.mobile}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-100 px-3 py-1 rounded-lg font-medium text-slate-700 text-xs">{fig.lean}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Infrastructure & MLA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-bold text-slate-900">Infrastructure Ratings</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(data.infrastructure || {}).map(([key, rating]: [any, any]) => (
                                <div key={key} className="flex flex-col gap-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{key}</span>
                                    <span className={`text-sm font-bold ${
                                        rating === 'good' ? 'text-green-600' : 
                                        rating === 'average' ? 'text-yellow-600' : 
                                        'text-red-500'
                                    }`}>
                                        {rating === 'good' ? 'अच्छी' : rating === 'average' ? 'औसत' : 'खराब'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <Zap className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-xl font-bold text-slate-900">MLA Performance</h2>
                        </div>
                        <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
                            <p className="text-xs font-bold text-indigo-200 uppercase mb-1">Overall Rating</p>
                            <p className="text-4xl font-black capitalize tracking-tight mb-4">
                                {data.mlaRating === 'good' ? 'Excellent' : data.mlaRating === 'average' ? 'Average' : 'Poor'}
                            </p>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-indigo-200 uppercase">Key Dev Works</p>
                                <ul className="space-y-1">
                                    {data.mlaDevWorks?.filter((w: string) => w).map((work: string, i: number) => (
                                        <li key={i} className="text-sm font-medium flex items-start gap-2">
                                            <div className="w-1 h-1 bg-white rounded-full mt-2 flex-shrink-0" />
                                            {work}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Local Issues & 2021 Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-700">Top Local Issues (स्थानीय मुद्दे)</p>
                        <div className="flex flex-wrap gap-2">
                            {data.localIssues?.filter((i: string) => i).map((issue: string, idx: number) => (
                                <div key={idx} className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-bold border border-red-100">
                                    {issue}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-700">2021 Election Impact Factors</p>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-700 text-sm leading-relaxed">
                            {data.election2021Factors || 'No data recorded.'}
                        </div>
                    </div>
                </div>

                {/* Social Group Table */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <Users className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-900">Social Group Analysis</h2>
                    </div>
                    <div className="overflow-hidden border border-slate-100 rounded-3xl">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-slate-500 font-bold uppercase text-[9px]">
                                    <th className="p-4 text-left">Category & Caste</th>
                                    <th className="p-4 text-left">Families/Votes</th>
                                    <th className="p-4 text-left">Key Persons</th>
                                    <th className="p-4 text-left">Mobile</th>
                                    <th className="p-4 text-left">Political Leaning</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.socialGroups?.map((group: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{group.category}</p>
                                            <p className="text-sm font-bold text-slate-900">{group.caste}</p>
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">{group.votes || '-'}</td>
                                        <td className="p-4 text-slate-600 font-semibold">{group.keyPersons || '-'}</td>
                                        <td className="p-4 text-slate-500 font-mono italic">{group.mobile || '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase ${
                                                group.lean?.toLowerCase().includes('bjp') ? 'bg-orange-100 text-orange-700' :
                                                group.lean?.toLowerCase().includes('inc') ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {group.lean || 'None'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Organizations & Rebells */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-700">Organizations (संस्थाएँ)</p>
                        <div className="space-y-3">
                            {data.organizations?.map((org: any, i: number) => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-900">{org.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">{org.keyPerson} • {org.mobile}</p>
                                    </div>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase">{org.impact} Impact</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-700">Rebel Impact & Final Assessment</p>
                        <div className="space-y-4">
                            <div className="bg-red-50/50 p-5 rounded-3xl border border-red-100/50">
                                <p className="text-[10px] font-bold text-red-400 uppercase mb-2">Rebel Candidates</p>
                                <p className="text-sm text-red-900 leading-relaxed font-medium">{data.rebelCandidates || 'None'}</p>
                            </div>
                            <div className="bg-slate-900 p-8 rounded-[2rem] text-slate-100 relative shadow-2xl">
                                <FileText className="absolute right-6 top-6 w-12 h-12 text-slate-800" />
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Final Verdict (आकलन)</p>
                                <p className="text-lg leading-relaxed font-light font-serif">
                                    {data.finalAssessment}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
