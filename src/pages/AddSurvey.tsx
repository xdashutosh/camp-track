import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';

export const AddSurveyPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        localityName: '',
        researcherName: '',
        areaType: 'gaaon', // urban (shari), kasba, gaaon
        strongestParty: '',
        strongestPartyReason: '',
        keyFigures: [{ name: '', community: '', mobile: '', lean: '' }],
        partyStrength: {
            bjp: 'good',
            inc: 'average',
            aiudf: 'average',
            uppl: 'average',
            bpf: 'average',
            agp: 'average',
            cpim: 'average'
        },
        mlaRating: 'average',
        mlaDevWorks: ['', '', ''],
        infrastructure: {
            electricity: 'average',
            roads: 'average',
            water: 'average',
            health: 'average',
            schools: 'average',
            employment: 'average'
        },
        localIssues: ['', '', '', '', '', '', ''],
        election2021Factors: '',
        socialGroups: [
            // FCH (General)
            { category: 'FCH (General)', caste: 'Brahmin / বামুন', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'FCH (General)', caste: 'Kayastha / কায়স্থ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'FCH (General)', caste: 'Rajbanshi / ৰাজবংশী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'FCH (General)', caste: 'Vaishya / বৈশ্য', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'FCH (General)', caste: 'Bengali Hindu / বাঙালী হিন্দু', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'FCH (General)', caste: 'Marwari / মৰৱাৰী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'FCH (General)', caste: 'Jain / জৈন', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'FCH (General)', caste: 'Gorkha / গোৰ্খা', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'FCH (General)', caste: 'Other FCs / অন্যান্য এফচি', votes: '', keyPersons: '', mobile: '', lean: '' },
            
            // OBCs
            { category: 'OBCs', caste: 'Chutia / চুতীয়া', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Kalita / কলিতা', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Goriya / গৰিয়া', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Kumar / কুমাৰ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Ghosh / ঘোষ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Keot / কেইওট', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Ganak / গণক', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Yogi / যোগী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Nath / নাথ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Choudhury / চৌধুৰী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Barman / বৰ্মণ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Koch-Rajbanshi (OBC variant) / কোচ-ৰাজবংশী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Tirki', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'OBCs', caste: 'Other OBC / অন্যান্য ওবিচি', votes: '', keyPersons: '', mobile: '', lean: '' },

            // SCs
            { category: 'SCs', caste: 'DAS/ দাস', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Kaibartta / কৈবর্ত্ত', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Namasudra / নামশূদ্ৰ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Bhuinmali / ভূমিমালি', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Mali / মালী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Muchi / মুচি', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Dhupi / ধূপী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Bansphor / বাঁশফোৰ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Arju / অৰ্জু', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Jalkeot / जलकियत', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Wiswas / বিশ্বাস', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Patni / পত্নী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'swarnkar / স্বৰ্ণকাৰ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Mandal / মণ্ডল', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Pal / পাল', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Tudu / টুডু', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Hadsa / হাদছা', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Sidda / সিদ্দা', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'SCs', caste: 'Other SC / অন্যান্য এছচি', votes: '', keyPersons: '', mobile: '', lean: '' },

            // STs
            { category: 'STs', caste: 'Bodo / বড়ো', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Mishing (Miri) / মিচিং', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Karbi / কাৰ্বি', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Dimasa / ডিমাছা', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Deori / দেওৰি', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Lalung (Tiwa) / লালুং', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Rabha / ৰাভা', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Sonowal Kachari / সোনোৱাল কচাৰী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Garo / গাৰো', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Khasi / খাচী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Chakma / চাকমা', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Hmar / হমাৰ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Baite / বাইটে', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Barman / বর্মণ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'STs', caste: 'Other ST / অন্যান্য এছটি', votes: '', keyPersons: '', mobile: '', lean: '' },

            // Tea Garden Adivasi
            { category: 'Tea Garden Adivasi', caste: 'Munda / মুন্ডা', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Santhal / চাঁওতাল', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Oraon / উৰাঁও', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Tanti / তান্তি', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Kharia / খাৰিয়া', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Lohar / লোহাৰ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Teli / তেলী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Bedia / বেদিয়া', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Chik Baraik / চিক বারইক', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Other Tea Tribes / অন্যান্য চাহ জনগোষ্ঠী', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Tea Garden Adivasi', caste: 'Hajong / হাজং', votes: '', keyPersons: '', mobile: '', lean: '' },

            // Religious/Other
            { category: 'Religious/Other', caste: 'Muslim', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Religious/Other', caste: 'Christian / খ্ৰীষ্টান', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Religious/Other', caste: 'Sikh / শিখ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Religious/Other', caste: 'Buddhist / বৌদ্ধ', votes: '', keyPersons: '', mobile: '', lean: '' },
            { category: 'Religious/Other', caste: 'Others / অন্যান্য', votes: '', keyPersons: '', mobile: '', lean: '' },
        ],
        partyWorkers: [{ party: '', name: '', caste: '', gender: '', age: '', mobile: '', impact: '' }],
        angryWorkers: [{ party: '', name: '', caste: '', gender: '', age: '', mobile: '', impact: '' }],
        representatives: [{ name: '', gender: '', age: '', caste: '', mobile: '', reason: '', lean: '', impact: '' }],
        organizations: [{ name: '', impact: '', targetGroup: '', keyPerson: '', mobile: '' }],
        rebelCandidates: '',
        finalAssessment: ''
    });

    const updateField = (path: string, value: any) => {
        setForm(prev => {
            const newForm = { ...prev };
            // Simple path handling for depth 1 or 2
            if (path.includes('.')) {
                const [key, subKey] = path.split('.');
                (newForm as any)[key][subKey] = value;
            } else {
                (newForm as any)[path] = value;
            }
            return newForm;
        });
    };

    const updateArrayField = (key: string, index: number, field: string, value: any) => {
        setForm(prev => {
            const newArr = [...(prev as any)[key]];
            newArr[index] = { ...newArr[index], [field]: value };
            return { ...prev, [key]: newArr };
        });
    };

    const addRow = (key: string, template: any) => {
        setForm(prev => ({ ...prev, [key]: [...(prev as any)[key], template] }));
    };

    const removeRow = (key: string, index: number) => {
        setForm(prev => ({ ...prev, [key]: (prev as any)[key].filter((_: any, i: number) => i !== index) }));
    };

    const handleSubmit = async () => {
        if (!form.localityName) {
            alert('Please enter Locality Name');
            setStep(1);
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/admin/surveys', {
                localityName: form.localityName,
                surveyData: form
            });
            navigate('/surveys');
        } catch (error) {
            console.error(error);
            alert('Failed to save survey');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Locality Name (क्षेत्र का नाम)</label>
                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" value={form.localityName} onChange={e => updateField('localityName', e.target.value)} placeholder="Enter locality name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Researcher Name (शोधकर्ता का नाम)</label>
                                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" value={form.researcherName} onChange={e => updateField('researcherName', e.target.value)} placeholder="Enter researcher name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Area Type (क्षेत्र कैसा है?)</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" value={form.areaType} onChange={e => updateField('areaType', e.target.value)}>
                                        <option value="shari">शहरी (Urban)</option>
                                        <option value="kasba">कस्बा (Town)</option>
                                        <option value="gaaon">गाँव (Village)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Political Overview</h2>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Which party is stronger? (कौन सी पार्टी अधिक मजबूत रहती है?)</label>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" 
                                    value={form.strongestParty} 
                                    onChange={e => updateField('strongestParty', e.target.value)}
                                >
                                    <option value="">Select Party</option>
                                    <option value="BJP">Bhartiya Janta Party (BJP)</option>
                                    <option value="INC">Indian National Congress (INC)</option>
                                    <option value="UPPL">United People's Party Liberal (UPPL)</option>
                                    <option value="BPF">Bodoland People's Front (BPF)</option>
                                    <option value="AGP">Asom Gana Parishad (AGP)</option>
                                    <option value="CPIM">Communist Party of India (Marxist) (CPIM)</option>
                                    <option value="OTH">Other (अन्य)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reason (क्या कारण है?)</label>
                                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" rows={3} value={form.strongestPartyReason} onChange={e => updateField('strongestPartyReason', e.target.value)} />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Influential Groups & Figures (प्रमुख गुट और राजनीतिक व्यक्ति)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-semibold">
                                            <th className="p-3 text-left">गुट के प्रमुख व्यक्ति</th>
                                            <th className="p-3 text-left">समुदाय</th>
                                            <th className="p-3 text-left">मोबाईल</th>
                                            <th className="p-3 text-left">झुकाव</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {form.keyFigures.map((fig, i) => (
                                            <tr key={i}>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 focus:ring-0 p-1" value={fig.name} onChange={e => updateArrayField('keyFigures', i, 'name', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 focus:ring-0 p-1" value={fig.community} onChange={e => updateArrayField('keyFigures', i, 'community', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 focus:ring-0 p-1" value={fig.mobile} onChange={e => updateArrayField('keyFigures', i, 'mobile', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 focus:ring-0 p-1" value={fig.lean} onChange={e => updateArrayField('keyFigures', i, 'lean', e.target.value)} /></td>
                                                <td className="p-2 text-right">
                                                    <button onClick={() => removeRow('keyFigures', i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => addRow('keyFigures', { name: '', community: '', mobile: '', lean: '' })} className="text-indigo-600 font-semibold text-sm flex items-center gap-1 hover:text-indigo-700">
                                <Plus className="w-4 h-4" /> Add Row
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Party Organization Status (संगठन की स्थिति)</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(form.partyStrength).map(([party, rating]) => (
                                    <div key={party} className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 uppercase">{party}</label>
                                        <div className="flex gap-2">
                                            {['good', 'average', 'bad'].map(r => (
                                                <button 
                                                    key={r} 
                                                    onClick={() => updateField(`partyStrength.${party}`, r)}
                                                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold border transition-all ${rating === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                                >
                                                    {r === 'good' ? 'अच्छी' : r === 'average' ? 'औसत' : 'खराब'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">MLA Performance (विधायक के काम-काज)</h2>
                            <div className="flex gap-4 max-w-md">
                                {['good', 'average', 'bad'].map(r => (
                                    <button 
                                        key={r} 
                                        onClick={() => updateField('mlaRating', r)}
                                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold border transition-all ${form.mlaRating === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                    >
                                        {r === 'good' ? 'अच्छी' : r === 'average' ? 'औसत' : 'खराब'}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-3 pt-2">
                                <label className="block text-sm font-medium text-slate-700">Main Development Works (मुख्य विकास कार्य)</label>
                                {form.mlaDevWorks.map((work, i) => (
                                    <input key={i} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" value={work} onChange={e => {
                                        const newWorks = [...form.mlaDevWorks];
                                        newWorks[i] = e.target.value;
                                        updateField('mlaDevWorks', newWorks);
                                    }} placeholder={`${i + 1}.`} />
                                ))}
                                <button onClick={() => updateField('mlaDevWorks', [...form.mlaDevWorks, ''])} className="text-indigo-600 text-sm font-bold">+ Add Work</button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Infrastructure Status (सुविधाओं की स्थिति)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {Object.entries(form.infrastructure).map(([key, rating]) => (
                                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-4">
                                        <span className="text-sm font-bold text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <div className="flex gap-1">
                                            {['good', 'average', 'bad'].map(r => (
                                                <button 
                                                    key={r} 
                                                    onClick={() => updateField(`infrastructure.${key}`, r)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${rating === r ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                                >
                                                    {r === 'good' ? 'अच्छी' : r === 'average' ? 'औसत' : 'खराब'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Local Issues (स्थानीय मुद्दे और आवश्यकताएँ)</h2>
                            <div className="space-y-3">
                                {form.localIssues.map((issue, i) => (
                                    <input key={i} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" value={issue} onChange={e => {
                                        const newIssues = [...form.localIssues];
                                        newIssues[i] = e.target.value;
                                        updateField('localIssues', newIssues);
                                    }} placeholder={`${i + 1}.`} />
                                ))}
                                <button onClick={() => updateField('localIssues', [...form.localIssues, ''])} className="text-indigo-600 text-sm font-bold">+ Add Issue</button>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">2021 Election Factors (2021 विधानसभा चुनाव प्रभावित करने वाली बातें)</h2>
                            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" rows={4} value={form.election2021Factors} onChange={e => updateField('election2021Factors', e.target.value)} />
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Social Group Analysis (सामाजिक वर्ग और महत्वपूर्ण व्यक्ति)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                                            <th className="p-3 text-left">वर्ग/समाज</th>
                                            <th className="p-3 text-left">परिवार/वोट</th>
                                            <th className="p-3 text-left">महत्वपूर्ण व्यक्ति</th>
                                            <th className="p-3 text-left">मोबाइल</th>
                                            <th className="p-3 text-left">झुकाव</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {form.socialGroups.map((group, i) => (
                                            <tr key={i}>
                                                <td className="p-2">
                                                    <p className="text-[10px] text-slate-400 font-bold">{group.category}</p>
                                                    <p className="font-semibold">{group.caste}</p>
                                                </td>
                                                <td className="p-2"><input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500/20" value={group.votes} onChange={e => updateArrayField('socialGroups', i, 'votes', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500/20" value={group.keyPersons} onChange={e => updateArrayField('socialGroups', i, 'keyPersons', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500/20" value={group.mobile} onChange={e => updateArrayField('socialGroups', i, 'mobile', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500/20" value={group.lean} onChange={e => updateArrayField('socialGroups', i, 'lean', e.target.value)} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Party Political Workers (प्रमुख राजनीतिक कार्यकर्ता)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-bold">
                                            <th className="p-3 text-left">पार्टी</th>
                                            <th className="p-3 text-left">नाम</th>
                                            <th className="p-3 text-left">समाज</th>
                                            <th className="p-3 text-left">मोबाइल</th>
                                            <th className="p-3 text-left">असर</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {form.partyWorkers.map((w, i) => (
                                            <tr key={i}>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={w.party} onChange={e => updateArrayField('partyWorkers', i, 'party', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={w.name} onChange={e => updateArrayField('partyWorkers', i, 'name', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={w.caste} onChange={e => updateArrayField('partyWorkers', i, 'caste', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={w.mobile} onChange={e => updateArrayField('partyWorkers', i, 'mobile', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={w.impact} onChange={e => updateArrayField('partyWorkers', i, 'impact', e.target.value)} /></td>
                                                <td className="p-2 text-right"><button onClick={() => removeRow('partyWorkers', i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => addRow('partyWorkers', { party: '', name: '', caste: '', gender: '', age: '', mobile: '', impact: '' })} className="text-indigo-600 font-bold text-xs flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Add Worker
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Social & Religious Orgs (सामाजिक और धार्मिक संस्थाएँ)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 font-bold">
                                            <th className="p-3 text-left">संस्था का नाम</th>
                                            <th className="p-3 text-left">असर</th>
                                            <th className="p-3 text-left">महत्वपूर्ण व्यक्ति</th>
                                            <th className="p-3 text-left">मोबाइल</th>
                                            <th className="p-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {form.organizations.map((org, i) => (
                                            <tr key={i}>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={org.name} onChange={e => updateArrayField('organizations', i, 'name', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={org.impact} onChange={e => updateArrayField('organizations', i, 'impact', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={org.keyPerson} onChange={e => updateArrayField('organizations', i, 'keyPerson', e.target.value)} /></td>
                                                <td className="p-2"><input type="text" className="w-full bg-transparent border-0 p-1" value={org.mobile} onChange={e => updateArrayField('organizations', i, 'mobile', e.target.value)} /></td>
                                                <td className="p-2 text-right"><button onClick={() => removeRow('organizations', i)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={() => addRow('organizations', { name: '', impact: '', targetGroup: '', keyPerson: '', mobile: '' })} className="text-indigo-600 font-bold text-xs flex items-center gap-1">
                                <Plus className="w-4 h-4" /> Add Org
                            </button>
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-slate-900 border-b pb-2">Final Assessment</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Impact of Rebel Candidates? (बागी उम्मीदवार का प्रभाव)</label>
                                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" rows={3} value={form.rebelCandidates} onChange={e => updateField('rebelCandidates', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Final Analysis (आपका आकलन)</label>
                                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3" rows={6} value={form.finalAssessment} onChange={e => updateField('finalAssessment', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex-shrink-0 flex items-center justify-between">
                <button onClick={() => navigate('/surveys')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Surveys
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
                        Step {step} of 7
                    </span>
                    {step === 7 && (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : <><Save className="w-5 h-5" /> Save Survey</>}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {renderStep()}
            </div>

            <div className="flex-shrink-0 flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                    disabled={step === 1}
                    onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                </button>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(s => (
                        <div key={s} className={`w-2 h-2 rounded-full transition-all ${step === s ? 'w-8 bg-indigo-600' : 'bg-slate-200'}`} />
                    ))}
                </div>
                {step < 7 ? (
                    <button
                        onClick={() => setStep(s => s + 1)}
                        className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        Next
                        <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <div className="w-20" /> // Placeholder to keep layout consistent
                )}
            </div>
        </div>
    );
};
