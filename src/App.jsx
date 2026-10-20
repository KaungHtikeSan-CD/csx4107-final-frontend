import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { HashRouter, Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { UserContext } from "./context/UserContext";
import "./App.css";

const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(n);
const emptyCourse = { name: "", duration: 7, topics: "", price: 0, maxStudent: 20, status: "Open" };
function useAuth() { return useContext(UserContext); }
function Icon({ name, size = 20 }) {
  const paths = {
    book: <><path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h3z"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    logout: <><path d="M9 4H4v16h5m6-13 5 5-5 5m-6-5h11"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.book}</svg>;
}
function Brand() { return <span className="brand"><span className="brand-mark"><Icon name="book" size={23}/></span>course<span className="brand-light">space</span><span className="brand-dot">.</span></span>; }
function Status({ value }) { return <span className={`status ${value.toLowerCase()}`}><i/>{value === "Close" ? "Closed" : value === "Cancel" ? "Cancelled" : "Open"}</span>; }
function ErrorBox({ message }) { return message ? <div className="alert error" role="alert">{message}</div> : null; }
function Loading() { return <div className="loading" role="status"><span className="spinner"/> Loading your workspace…</div>; }
function Login() {
  const { user, login, sessionError } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/courses" replace/>;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { await login(form.login, form.password); } catch (e) { setError(e.message === "Failed to fetch" ? "Cannot reach the server. Check your connection and try again." : e.message); }
    finally { setBusy(false); }
  }
  return <div className="login-page"><section className="login-story"><Brand/><div className="story-content"><span className="eyebrow">A LITTLE CURIOSITY. A WORLD OF POSSIBILITY.</span><h1>Your next chapter<br/>starts here<span>.</span></h1><p>Learn something new. Share what you know.<br/>Make room for what comes next.</p><div className="story-illustration" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floating-book"><Icon name="book" size={100}/></div><span className="float-label label-one">Learn at your pace</span><span className="float-label label-two">Build your future ↗</span><span className="star">✳</span></div></div><p className="story-footer">A space for students. A platform for teachers.</p></section><section className="login-panel"><div className="login-form"><span className="eyebrow">WELCOME TO COURSESPACE</span><h2>Good to see you.</h2><p className="muted">Sign in to pick up where your curiosity left off.</p><ErrorBox message={error || sessionError}/><form onSubmit={submit}><label>Username or email<input autoComplete="username" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="Enter your username or email" required maxLength={150}/></label><label>Password<input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" required maxLength={72}/></label><button className="button primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}<Icon name="arrow"/></button></form><div className="test-logins"><strong>Exploring the platform?</strong><p>Use a test account to try either workspace.</p><div><button type="button" onClick={() => setForm({ login: "student1", password: "Student123!" })}>Student account ↗</button><button type="button" onClick={() => setForm({ login: "teacher1", password: "Teacher123!" })}>Teacher account ↗</button></div></div></div><span className="login-footnote">LEARN SOMETHING THAT MOVES YOU FORWARD.</span></section></div>;
}
function Layout() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!user) return <Navigate to="/login" replace/>;
  return <div className="workspace"><aside className="sidebar"><Brand/><div className="workspace-label">YOUR WORKSPACE</div><nav><NavLink to="/courses" end><Icon name="grid"/>{user.role === "Teacher" ? "My courses" : "Explore courses"}</NavLink>{user.role === "Student" && <NavLink to="/enrolled"><Icon name="book"/>My learning</NavLink>}{user.role === "Teacher" && <NavLink to="/courses/new"><Icon name="plus"/>Create a course</NavLink>}</nav><div className="sidebar-note"><span>KEEP GROWING</span><p>{user.role === "Teacher" ? "Your knowledge could be someone's next beginning." : "A little progress, every day. Find your next possibility."}</p><Icon name="arrow"/></div><div className="account"><span className="avatar">{user.username.slice(0, 2).toUpperCase()}</span><div><strong>{user.username}</strong><span>{user.role} account</span></div><button className="icon-button" title="Sign out" aria-label="Sign out" disabled={busy} onClick={async () => { setBusy(true); try { await logout(); } catch { /* Local session is cleared even if offline. */ } finally { setBusy(false); } }}><Icon name="logout"/></button></div></aside><main className="main"><header className="topbar"><span>Workspace <span className="slash">/</span> <strong>{user.role === "Teacher" ? "Teaching" : "Learning"}</strong></span><span className="role-chip">{user.role} workspace</span></header><Routes><Route path="/courses" element={<CourseList/>}/><Route path="/enrolled" element={<CourseList enrolled/>}/><Route path="/courses/new" element={<CourseForm/>}/><Route path="/courses/:id/edit" element={<CourseForm/>}/><Route path="/courses/:id" element={<CourseDetails/>}/><Route path="*" element={<Navigate to="/courses" replace/>}/></Routes><footer className="page-footer">A little learning goes a long way.<span>COURSESPACE © 2026</span></footer></main></div>;
}
function CourseCard({ course, index }) {
  const navigate = useNavigate();
  return <article className="course-card"><div className={`course-art art-${index % 4}`}><span className="art-number">{String(index + 1).padStart(2, "0")}</span><span className="art-shape shape-a"/><span className="art-shape shape-b"/><span className="art-shape shape-c"/><span className="art-caption">{course.topics[0]}</span><Status value={course.status}/></div><div className="card-body"><div className="card-teacher"><span className="mini-avatar">{course.teacher.username.slice(0, 1).toUpperCase()}</span>{course.teacher.username}{course.enrolled && <span className="enrolled-label"><Icon name="check" size={13}/>Enrolled</span>}</div><h3><NavLink to={`/courses/${course.id}`}>{course.name}</NavLink></h3><div className="topics">{course.topics.slice(0, 3).map((t) => <span key={t}>{t}</span>)}{course.topics.length > 3 && <span>+{course.topics.length - 3}</span>}</div><div className="card-meta"><span><Icon name="clock" size={16}/>{course.duration} days</span><span><Icon name="users" size={16}/>{course.enrolledCount}/{course.maxStudent} students</span></div><div className="seat-track"><span style={{ width: `${Math.min(100, course.enrolledCount / course.maxStudent * 100)}%` }}/></div><div className="card-bottom"><strong>{course.price === 0 ? "Free" : money(course.price)}<small>{course.price === 0 ? "Start something new" : "per course"}</small></strong><button className="round-button" aria-label={`View ${course.name}`} onClick={() => navigate(`/courses/${course.id}`)}><Icon name="arrow"/></button></div></div></article>;
}
function CourseList({ enrolled = false }) {
  const { user, api } = useAuth();
  const [params, setParams] = useSearchParams();
  const search = params.get("q") || "";
  const [query, setQuery] = useState(search);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("All");
  const [retry, setRetry] = useState(0);
  const teacher = user.role === "Teacher";
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    api(`/api/course?enrolled=${enrolled}&q=${encodeURIComponent(search)}`).then((data) => { if (active) setCourses(data.courses); })
      .catch((e) => { if (active) setError(e.message === "Failed to fetch" ? "Unable to reach the server. Please try again." : e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, enrolled, search, retry]);
  const shown = courses.filter((c) => status === "All" || c.status === status);
  return <div className="page-content"><div className="page-heading"><div><span className="eyebrow">{teacher ? "SHARE WHAT YOU KNOW" : enrolled ? "MAKE TIME FOR YOURSELF" : "STAY CURIOUS. KEEP GROWING."}</span><h1>{teacher ? "Your teaching, in one place." : enrolled ? "Your learning journey." : "Find your next possibility."}</h1><p className="muted">{teacher ? "Create meaningful courses. Meet your students. Make an impact." : enrolled ? "Every new skill starts with showing up. Here's where you're headed." : "Discover courses from passionate teachers and take the next step."}</p></div>{teacher && <NavLink className="button primary" to="/courses/new"><Icon name="plus"/>Create course</NavLink>}</div><div className="overview"><div><span className="stat-icon mint"><Icon name="book"/></span><div><strong>{loading ? "—" : courses.length}</strong><span>{teacher ? "Your courses" : enrolled ? "Enrolled courses" : "Courses to explore"}</span></div></div><div><span className="stat-icon peach"><Icon name={teacher ? "users" : "check"}/></span><div><strong>{loading ? "—" : teacher ? courses.reduce((n, c) => n + c.enrolledCount, 0) : courses.filter((c) => c.enrolled).length}</strong><span>{teacher ? "Total enrollments" : "Your enrollments"}</span></div></div><div><span className="stat-icon lilac"><Icon name="grid"/></span><div><strong>{loading ? "—" : courses.filter((c) => c.status === "Open").length}</strong><span>Open courses</span></div></div><div className="overview-message">Small steps.<br/><strong>Big possibilities. ↗</strong></div></div><section className="catalog"><div className="catalog-title"><h2>{teacher ? "Course library" : enrolled ? "My courses" : "The course collection"}<span>{shown.length}</span></h2><p>Something worth learning.</p></div><div className="toolbar"><div className="filter-tabs">{["All", "Open", "Close", ...(teacher ? ["Cancel"] : [])].map((s) => <button key={s} className={status === s ? "selected" : ""} onClick={() => setStatus(s)}>{s === "All" ? "All courses" : s === "Close" ? "Closed" : s === "Cancel" ? "Cancelled" : s}</button>)}</div><form className="search" onSubmit={(e) => { e.preventDefault(); setParams(query ? { q: query } : {}); }}><Icon name="search" size={18}/><input aria-label="Search by course or teacher" value={query} onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setParams({}); }} placeholder="Search courses or teachers…"/><button type="submit">Search</button></form></div><ErrorBox message={error}/>{error && <button className="button secondary" onClick={() => setRetry((n) => n + 1)}>Try again</button>}{loading ? <Loading/> : !error && (shown.length ? <div className="course-grid">{shown.map((c, i) => <CourseCard key={c.id} course={c} index={i}/>)}</div> : <div className="empty-state"><Icon name="book" size={42}/><h3>{search ? "No matching courses" : enrolled ? "Your next chapter is waiting" : "A fresh start"}</h3><p>{search ? "Try another course or teacher name." : enrolled ? "Explore the collection and enroll in your first course." : teacher ? "Share your expertise by creating your first course." : "There are no courses here yet. Check back soon."}</p>{(teacher || enrolled) && <NavLink className="button primary" to={teacher ? "/courses/new" : "/courses"}>{teacher ? "Create a course" : "Explore courses"}<Icon name="arrow"/></NavLink>}</div>)}</section></div>;
}
function CourseDetails() {
  const { id } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const load = useCallback(async () => {
    try { const data = await api(`/api/course/${id}`); setCourse(data.course); }
    catch (e) { setError(e.message); }
  }, [api, id]);
  useEffect(() => { load(); }, [load]);
  async function enroll() {
    setBusy(true); setError("");
    try { const data = await api(`/api/course/${id}/enroll`, { method: "POST" }); setCourse(data.course); setMessage("You're in! This course is now in My learning."); }
    catch (e) { setError(e.message); await load(); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError("");
    try { await api(`/api/course/${id}`, { method: "DELETE" }); navigate("/courses"); }
    catch (e) { setError(e.message); setConfirmDelete(false); } finally { setBusy(false); }
  }
  const teacher = user.role === "Teacher";
  return <div className="page-content"><NavLink className="back-link" to="/courses">← Back to courses</NavLink><ErrorBox message={error}/>{!course ? !error && <Loading/> : <><div className="detail-hero"><span className="eyebrow">{teacher ? "YOUR COURSE" : "YOUR NEXT CHAPTER"}</span><div><h1>{course.name}</h1><Status value={course.status}/></div><p>Taught by <strong>{course.teacher.username}</strong></p><span className="detail-decoration" aria-hidden="true">↗</span></div>{message && <div className="alert success" role="status"><Icon name="check"/>{message}</div>}<div className="detail-columns"><section className="detail-panel"><h2>A little more about this course</h2><p className="muted">Build your knowledge, one topic at a time.</p><h3>What you'll learn</h3><ol className="topic-list">{course.topics.map((topic, i) => <li key={topic}><span>{String(i + 1).padStart(2, "0")}</span>{topic}<Icon name="check" size={17}/></li>)}</ol>{teacher && <div className="student-section"><h2>Enrolled students <span className="count-badge">{course.enrolledCount}</span></h2>{course.students?.length ? <div className="student-table"><table><thead><tr><th>Student</th><th>Email</th></tr></thead><tbody>{course.students.map((s) => <tr key={s.id}><td>{s.username}</td><td>{s.email}</td></tr>)}</tbody></table></div> : <p className="muted">No students yet. Your next great class starts here.</p>}</div>}</section><aside className="detail-panel enrollment-panel"><span className="eyebrow">INVEST IN YOUR NEXT STEP</span><div className="detail-price">{course.price ? money(course.price) : "Free"}<span>per course</span></div><dl><div><dt><Icon name="clock" size={18}/>Duration</dt><dd>{course.duration} days</dd></div><div><dt><Icon name="users" size={18}/>Enrolled</dt><dd>{course.enrolledCount} / {course.maxStudent}</dd></div><div><dt><Icon name="book" size={18}/>Topics</dt><dd>{course.topics.length}</dd></div></dl><div className="seat-track"><span style={{ width: `${course.enrolledCount / course.maxStudent * 100}%` }}/></div><p className="seat-note">{course.seatsRemaining} {course.seatsRemaining === 1 ? "seat" : "seats"} remaining</p>{teacher ? <><NavLink className="button primary full" to={`/courses/${id}/edit`}>Edit course<Icon name="arrow"/></NavLink><button className="button danger full" disabled={busy || course.enrolledCount > 0} onClick={() => setConfirmDelete(true)}>Delete course</button>{course.enrolledCount > 0 && <p className="hint">Courses with enrolled students cannot be deleted.</p>}</> : <><button className={`button ${course.enrolled ? "secondary" : "primary"} full`} disabled={busy || course.enrolled || course.status !== "Open" || !course.seatsRemaining} onClick={enroll}>{busy ? "Enrolling…" : course.enrolled ? "You're enrolled" : course.status !== "Open" ? "Enrollment closed" : !course.seatsRemaining ? "Course full" : "Enroll in this course"}<Icon name={course.enrolled ? "check" : "arrow"}/></button><p className="hint">{course.enrolled ? "Find this course in My learning." : course.status !== "Open" ? "This course is not accepting new enrollments." : "Make a little room for something new."}</p></>}</aside></div>{confirmDelete && <div className="modal-overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Delete this course?</h2><p>“{course.name}” will be permanently removed.</p><div className="form-actions"><button autoFocus className="button secondary" disabled={busy} onClick={() => setConfirmDelete(false)}>Keep course</button><button className="button danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete course"}</button></div></section></div>}</>}</div>;
}
function CourseForm() {
  const { id } = useParams();
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyCourse);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [enrolledCount, setEnrolledCount] = useState(0);
  const loadedId = useRef(null);
  useEffect(() => {
    if (!id || loadedId.current === id) return;
    let active = true;
    api(`/api/course/${id}`).then(({ course }) => { if (active) { setForm({ ...course, topics: course.topics.join("\n") }); setEnrolledCount(course.enrolledCount); loadedId.current = id; } })
      .catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, id]);
  if (user.role !== "Teacher") return <Navigate to="/courses" replace/>;
  function field(key) { return { value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) }; }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    const payload = { name: form.name, topics: form.topics.split(/\n|,/).map((t) => t.trim()).filter(Boolean), duration: Number(form.duration), price: Number(form.price), maxStudent: Number(form.maxStudent), status: form.status };
    try { const data = await api(`/api/course${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) }); navigate(`/courses/${data.course.id}`); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="page-content form-page"><NavLink className="back-link" to={id ? `/courses/${id}` : "/courses"}>← Back to {id ? "course" : "courses"}</NavLink><span className="eyebrow">TURN WHAT YOU KNOW INTO WHAT THEY LEARN</span><h1>{id ? "Make your course even better." : "Something great starts with you."}</h1><p className="muted">{id ? "Update the details, keep the learning going." : "Create a course and give your knowledge a place to grow."}</p><ErrorBox message={error}/>{loading ? <Loading/> : <form className="course-form" onSubmit={submit}><section><div className="form-section-heading"><span>01</span><div><h2>The essentials</h2><p>Give your course a name and a direction.</p></div></div><label>Course name<input {...field("name")} maxLength={150} placeholder="e.g. Building modern websites with React" required/></label><label>Topics<textarea {...field("topics")} rows={5} placeholder={"Getting started\nComponents and props\nHooks and state"} required/><small>Add one topic per line, or separate them with commas.</small></label></section><section><div className="form-section-heading"><span>02</span><div><h2>The practical details</h2><p>Set the pace, price, and size of your class.</p></div></div><div className="form-grid"><label>Duration (days)<input {...field("duration")} type="number" min="1" max="3650" step="1" required/></label><label>Price (THB)<input {...field("price")} type="number" min="0" max="10000000" step="0.01" required/></label><label>Maximum students<input {...field("maxStudent")} type="number" min={Math.max(1, enrolledCount)} max="10000" step="1" required/></label><label>Course status<select {...field("status")}><option value="Open">Open — accepting enrollments</option><option value="Close">Close — visible, no enrollments</option><option value="Cancel">Cancel — hidden from students</option></select></label></div><p className="hint">Open courses accept students while seats remain. Closed courses stay visible. Cancelled courses are hidden from students.</p></section><div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={() => navigate(id ? `/courses/${id}` : "/courses")}>Cancel</button><button className="button primary" disabled={busy || (Boolean(id) && loadedId.current !== id)}>{busy ? "Saving…" : id ? "Save changes" : "Create course"}<Icon name="arrow"/></button></div></form>}</div>;
}
function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <Loading/>;
  return <Routes><Route path="/login" element={<Login/>}/><Route path="/*" element={<Layout/>}/></Routes>;
}
export default function App() { return <HashRouter><AppRoutes/></HashRouter>; }
