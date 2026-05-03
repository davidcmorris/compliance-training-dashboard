import { useState, useEffect } from "react";

const EMPTY = {
  quarter: "",
  assigned: "",
  onTime: "",
  overdue: "",
  avgDaysPastDue: "",
  maxDaysPastDue: "",
  medianDaysPastDue: "",
};

function field(label, name, placeholder, type = "text") {
  return { label, name, placeholder, type };
}

const FIELDS = [
  field("Quarter Label", "quarter", "e.g. Q2 2026"),
  field("Assigned", "assigned", "e.g. 3100", "number"),
  field("On-Time", "onTime", "e.g. 3094", "number"),
  field("Overdue", "overdue", "e.g. 6", "number"),
  field("Avg Days Past Due", "avgDaysPastDue", "e.g. 3.2", "number"),
  field("Max Days Past Due", "maxDaysPastDue", "e.g. 14", "number"),
  field("Median Days Past Due", "medianDaysPastDue", "e.g. 2", "number"),
];

export default function DataEntryForm({ editTarget, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editTarget) {
      setForm({
        quarter: editTarget.quarter ?? "",
        assigned: editTarget.assigned ?? "",
        onTime: editTarget.onTime ?? "",
        overdue: editTarget.overdue ?? "",
        avgDaysPastDue: editTarget.avgDaysPastDue ?? "",
        maxDaysPastDue: editTarget.maxDaysPastDue ?? "",
        medianDaysPastDue: editTarget.medianDaysPastDue ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [editTarget]);

  function validate(f) {
    const e = {};
    if (!f.quarter.trim()) e.quarter = "Required";
    if (!f.assigned || Number(f.assigned) <= 0) e.assigned = "Must be > 0";
    if (f.onTime === "" || Number(f.onTime) < 0) e.onTime = "Must be ≥ 0";
    if (f.overdue === "" || Number(f.overdue) < 0) e.overdue = "Must be ≥ 0";
    if (Number(f.onTime) + Number(f.overdue) > Number(f.assigned))
      e.overdue = "On-time + overdue cannot exceed assigned";
    if (f.avgDaysPastDue === "" || Number(f.avgDaysPastDue) < 0) e.avgDaysPastDue = "Must be ≥ 0";
    if (f.maxDaysPastDue === "" || Number(f.maxDaysPastDue) < 0) e.maxDaysPastDue = "Must be ≥ 0";
    if (f.medianDaysPastDue === "" || Number(f.medianDaysPastDue) < 0) e.medianDaysPastDue = "Must be ≥ 0";
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      quarter: form.quarter.trim(),
      assigned: Number(form.assigned),
      onTime: Number(form.onTime),
      overdue: Number(form.overdue),
      avgDaysPastDue: Number(form.avgDaysPastDue),
      maxDaysPastDue: Number(form.maxDaysPastDue),
      medianDaysPastDue: Number(form.medianDaysPastDue),
    });
    setForm(EMPTY);
    setErrors({});
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-7 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-widest text-[#1a2744] mb-5 border-b-2 border-[#0d9488] pb-1.5 inline-block">
        {editTarget ? "Edit Period" : "Add Period"}
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {FIELDS.map(({ label, name, placeholder, type }) => (
            <div key={name} className={name === "quarter" ? "sm:col-span-2 lg:col-span-1" : ""}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                {label}
              </label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                step={type === "number" ? "any" : undefined}
                min={type === "number" ? "0" : undefined}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-medium text-[#1a2744] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent transition ${
                  errors[name] ? "border-red-400 bg-red-50" : "border-slate-200"
                }`}
              />
              {errors[name] && (
                <p className="text-xs text-red-600 mt-1">{errors[name]}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#0d9488] text-white text-sm font-semibold hover:bg-[#0f766e] active:scale-95 transition"
          >
            {editTarget ? "Update Period" : "Add Period"}
          </button>
          {editTarget && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
