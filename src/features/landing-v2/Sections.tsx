import {
	ArrowRight,
	AtSign,
	Mail,
	Menu,
	MessageCircle,
	Music2,
	X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import hero from "../../assets/v2/hero.webp";
import heroM from "../../assets/v2/hero-m.webp";
import logo from "../../assets/v2/logo.png";
import { CONTACT } from "../../config/business";
import { useInView, useQr } from "./hooks";
import { Reveal } from "./motion";

const NAV = [
	{ href: "#cach-dung", label: "Cách dùng" },
	{ href: "#mon-qua", label: "Món quà" },
	{ href: "#cau-chuyen", label: "Câu chuyện" },
	{ href: "#lien-he", label: "Liên hệ" },
	{ href: "/memory", label: "Quét kỷ niệm" },
];
const btnDark =
	"inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-cocoa px-7 text-[15px] font-medium text-cream transition-colors hover:bg-cocoa-deep";
const btnLine =
	"inline-flex min-h-[50px] items-center justify-center rounded-full border border-cocoa/30 bg-cream/70 px-7 text-[15px] font-medium text-cocoa backdrop-blur-sm transition-colors hover:border-cocoa/60";
const H2 =
	"font-serif text-[clamp(2.1rem,3.6vw,3.6rem)] font-normal leading-[1.08] text-cocoa";

/** Ô ảnh chờ tạo: ghi rõ mã shot trong brief, không giả vờ là ảnh thật. */
function Placeholder({
	code,
	desc,
	className = "",
}: {
	code: string;
	desc: string;
	className?: string;
}) {
	return (
		<div
			className={`flex flex-col items-center justify-center gap-2 rounded border-[1.5px] border-dashed border-taupe bg-[#EADFD2] p-8 text-center ${className}`}
		>
			<span className="text-[12px] font-semibold tracking-[0.18em] text-cocoa-soft">
				{code} · ẢNH CHỜ TẠO
			</span>
			<span className="max-w-[320px] text-[14px] leading-relaxed text-cocoa/70">
				{desc}
			</span>
		</div>
	);
}

export function V2Header({
	home = "/v2",
	logoSrc = logo,
	logoW = 629,
	logoH = 230,
	tagline = "LƯU GIỮ ĐIỀU QUAN TRỌNG",
	logoClass = "w-[clamp(78px,6.8vw,104px)]",
}: {
	home?: string;
	logoSrc?: string;
	logoW?: number;
	logoH?: number;
	tagline?: string;
	logoClass?: string;
}) {
	const [solid, setSolid] = useState(false);
	const [open, setOpen] = useState(false);
	useEffect(() => {
		const on = () => setSolid(window.scrollY > 40);
		on();
		window.addEventListener("scroll", on, { passive: true });
		return () => window.removeEventListener("scroll", on);
	}, []);
	return (
		<header
			className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${solid || open ? "bg-[#F7F1E7]/95 shadow-[0_1px_0_rgba(74,58,53,.08)] backdrop-blur-md" : ""}`}
		>
			<div className="lwrap flex h-[76px] items-center justify-between">
				<Link
					to={home}
					className="flex min-h-[44px] items-end gap-4"
					aria-label="chạm, về đầu trang"
				>
					<img
						src={logoSrc}
						alt="Chạm"
						width={logoW}
						height={logoH}
						className={`h-auto ${logoClass}`}
					/>
					<span className="hidden pb-1.5 text-[10.5px] tracking-[0.22em] text-cocoa-soft sm:inline">
						{tagline}
					</span>
				</Link>
				<nav
					aria-label="Điều hướng chính"
					className="hidden items-center gap-9 lg:flex"
				>
					{NAV.map((n) => (
						<a
							key={n.href}
							href={n.href}
							className="text-[14px] text-cocoa/85 underline-offset-8 hover:underline"
						>
							{n.label}
						</a>
					))}
				</nav>
				<div className="flex items-center gap-1">
					<Link
						to="/order"
						className={`${btnDark} hidden min-h-[46px] px-6 text-[14px] sm:inline-flex`}
					>
						Tạo món quà{" "}
						<ArrowRight aria-hidden className="h-4 w-4" />
					</Link>
					<button
						type="button"
						className="flex h-11 w-11 items-center justify-center rounded-full text-cocoa lg:hidden"
						aria-expanded={open}
						aria-label={open ? "Đóng menu" : "Mở menu"}
						onClick={() => setOpen((v) => !v)}
					>
						{open ? (
							<X className="h-5 w-5" />
						) : (
							<Menu className="h-5 w-5" />
						)}
					</button>
				</div>
			</div>
			{open && (
				<nav
					aria-label="Điều hướng chính"
					className="lwrap flex flex-col pb-4 lg:hidden"
				>
					{NAV.map((n) => (
						<a
							key={n.href}
							href={n.href}
							className="border-t border-taupe/30 py-3 text-[16px] text-cocoa"
							onClick={() => setOpen(false)}
						>
							{n.label}
						</a>
					))}
				</nav>
			)}
		</header>
	);
}

/** Kiểu chuyển động 1: ảnh hero zoom rất chậm, chữ hiện tầng lớp khi tải trang. */
type HeroImages = {
	img?: string;
	imgM?: string;
	pos?: string;
	alt?: string;
	altM?: string;
	sub?: string;
	note?: ReactNode;
};

export function V2Hero({
	img = hero,
	imgM = heroM,
	pos = "49% 50%",
	alt = "Người con trao khung ảnh kỷ niệm cho bà bên bàn gỗ, cạnh hộp quà thắt nơ.",
	altM = "Người con trao khung ảnh kỷ niệm cho bà.",
	sub = "Biến kỷ niệm của hai người thành một khung ảnh biết kể chuyện.",
	note,
}: HeroImages = {}) {
	return (
		<section className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#F5EEE5] lg:h-[min(100svh,56vw)] lg:min-h-[620px]">
			{/* Desktop: ảnh neo mép phải, mép trái mờ dần vào nền kem (giống hero landing cũ). */}
			<div
				className="absolute inset-y-0 right-0 hidden w-[70%] overflow-hidden lg:block"
				style={{
					WebkitMaskImage:
						"linear-gradient(to right, transparent, #000 30%)",
					maskImage:
						"linear-gradient(to right, transparent, #000 30%)",
				}}
			>
				<img
					src={img}
					alt={alt}
					className="v2-kenburns h-full w-full object-cover"
					style={{ objectPosition: pos }}
					fetchPriority="high"
				/>
				<div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F5EEE5]/60 to-transparent" />
			</div>
			<div className="absolute inset-x-0 bottom-0 h-[60%] lg:hidden">
				<img
					src={imgM}
					alt={altM}
					className="v2-kenburns h-full w-full object-cover"
					fetchPriority="high"
				/>
				<div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-[#F5EEE5] to-transparent" />
			</div>
			<div className="lwrap relative flex h-full flex-col pb-6 pt-24 lg:justify-center lg:pb-0 lg:pt-10">
				<h1
					className="v2-in max-w-[480px] font-serif text-[clamp(2.7rem,4.6vw,4.6rem)] font-normal leading-[1.03] text-cocoa"
					style={{ animationDelay: "150ms" }}
				>
					Có những điều chưa từng nói thành lời.
				</h1>
				<p
					className="v2-in mt-5 max-w-[400px] text-[clamp(1rem,1.25vw,1.2rem)] leading-relaxed text-cocoa/80"
					style={{ animationDelay: "450ms" }}
				>
					{sub}
				</p>
				{note && (
					<div
						className="v2-in mt-3"
						style={{ animationDelay: "600ms" }}
					>
						{note}
					</div>
				)}
				<div
					className="v2-in mt-auto flex flex-wrap gap-3 lg:mt-9"
					style={{ animationDelay: "750ms" }}
				>
					<Link to="/order" className={btnDark}>
						Tạo món quà{" "}
						<ArrowRight aria-hidden className="h-4 w-4" />
					</Link>
					<a href="#cach-dung" className={btnLine}>
						Xem cách dùng
					</a>
				</div>
			</div>
		</section>
	);
}

function Split({
	media,
	children,
	reverse = false,
	bg,
	id,
}: {
	media: ReactNode;
	children: ReactNode;
	reverse?: boolean;
	bg: string;
	id?: string;
}) {
	return (
		<section id={id} className={`scroll-mt-20 py-16 lg:py-[7vw] ${bg}`}>
			<div
				className={`lwrap flex flex-col gap-10 lg:items-center lg:gap-[7vw] ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}
			>
				<Reveal className="lg:w-[42%]">{media}</Reveal>
				<div className="lg:flex-1">{children}</div>
			</div>
		</section>
	);
}

export function OnePhoto() {
	return (
		<Split
			bg="bg-[#F7F1E7]"
			media={
				<Placeholder
					code="M1"
					desc="Tay người nhận giơ điện thoại hướng vào khung ảnh trên bàn. Tỷ lệ 4:5."
					className="aspect-[4/5]"
				/>
			}
		>
			<Reveal as="h2" className={H2}>
				Một bức ảnh.
				<br />
				Hai cách để nhớ.
			</Reveal>
			<Reveal
				as="p"
				delay={150}
				className="mt-5 max-w-md text-[clamp(1rem,1.25vw,1.2rem)] leading-relaxed text-cocoa/80"
			>
				Nhìn bằng mắt là ảnh. Nhìn qua điện thoại, ảnh sống lại.
			</Reveal>
		</Split>
	);
}

const FLOW = [
	{ n: "01", t: "Gửi ảnh, video", b: "Chỉ có ảnh cũ cũng được." },
	{ n: "02", t: "Duyệt bản xem trước", b: "Sửa tối đa 2 lần." },
	{ n: "03", t: "Nhận quà, trao đi", b: "3–5 ngày sau khi duyệt." },
];
export function Flow() {
	return (
		<section className="bg-[#F7F1E7] py-16 lg:py-[7vw]">
			<div className="lwrap">
				<Reveal as="h2" className={H2}>
					Bạn thấy món quà
					<br />
					trước người ấy.
				</Reveal>
				<ol className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-3 lg:gap-0">
					{FLOW.map((s, i) => (
						<Reveal
							as="li"
							key={s.n}
							delay={i * 140}
							className={`lg:px-[3vw] ${i === 0 ? "lg:pl-0" : "lg:border-l lg:border-taupe/40"}`}
						>
							<span className="font-serif text-[clamp(2.6rem,3.8vw,3.8rem)] leading-none text-cocoa">
								{s.n}
							</span>
							<h3 className="mt-3 text-[18px] font-medium text-cocoa">
								{s.t}
							</h3>
							<p className="mt-1 text-[15px] text-cocoa/70">
								{s.b}
							</p>
						</Reveal>
					))}
				</ol>
			</div>
		</section>
	);
}

export function Gift() {
	const items = [
		"Khung ảnh dọc 15 × 20 cm",
		"Mã quét ở mặt sau",
		"Hộp quà sẵn để trao",
	];
	return (
		<Split
			id="mon-qua"
			bg="bg-[#F2E9DF]"
			media={
				<Placeholder
					code="S1"
					desc="Khung ảnh cạnh hộp quà thắt nơ, khăn lanh, bàn gỗ, nắng chiều. Tỷ lệ 4:3."
					className="aspect-[4/3]"
				/>
			}
		>
			<Reveal as="h2" className={H2}>
				Trong hộp quà
			</Reveal>
			<ul className="mt-8">
				{items.map((t, i) => (
					<Reveal
						as="li"
						key={t}
						delay={i * 120}
						className="border-t border-taupe/40 py-4 text-[17px] text-cocoa"
					>
						{t}
					</Reveal>
				))}
			</ul>
			<Reveal
				delay={400}
				className="flex items-baseline justify-between border-t border-taupe/40 pt-4"
			>
				<span className="text-[15px] text-cocoa-soft">Giá từ</span>
				<span className="font-serif text-[clamp(1.6rem,2.3vw,2.2rem)] text-cocoa">
					[ĐANG CHỐT]
				</span>
			</Reveal>
		</Split>
	);
}

export function Story() {
	return (
		<Split
			id="cau-chuyen"
			reverse
			bg="bg-[#F7F1E7]"
			media={
				<Placeholder
					code="F1"
					desc="Ba đôi tay cùng làm khung ảnh bên bàn gỗ, không thấy mặt ai. Tỷ lệ 3:2."
					className="aspect-[3/2]"
				/>
			}
		>
			<Reveal as="h2" className={H2}>
				Vì sao có Chạm?
			</Reveal>
			<Reveal
				as="p"
				delay={150}
				className="mt-5 max-w-md text-[clamp(1rem,1.25vw,1.2rem)] leading-relaxed text-cocoa/80"
			>
				Hàng nghìn tấm ảnh trong điện thoại, chưa một lần được trao đi.
				Chạm đưa chúng ra khỏi màn hình.
			</Reveal>
			<Reveal
				as="p"
				delay={300}
				className="mt-6 text-[14px] text-cocoa-soft"
			>
				[Tên] · [Tên] · [Tên]
			</Reveal>
		</Split>
	);
}

export function V2Cta({
	heading = "Bạn muốn cảm ơn ai?",
	note,
}: { heading?: string; note?: ReactNode } = {}) {
	const qr = useQr(`mailto:${CONTACT.email}`);
	const who = ["Mẹ", "Người ấy", "Bạn thân", "Bố"];
	return (
		<section
			id="lien-he"
			className="scroll-mt-20 bg-[#53392D] py-16 text-cream lg:py-[6vw]"
		>
			<div className="lwrap flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<Reveal
						as="h2"
						className="font-serif text-[clamp(2.4rem,4.2vw,4.2rem)] font-normal leading-[1.05] text-cream"
					>
						{heading}
					</Reveal>
					<Reveal
						delay={150}
						className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1"
					>
						{who.map((w, i) => (
							<span
								key={w}
								className="flex items-center gap-4 font-serif text-[clamp(1.4rem,2vw,1.9rem)] text-cream/90"
							>
								{w}
								{i < who.length - 1 && (
									<span aria-hidden className="text-cream/35">
										·
									</span>
								)}
							</span>
						))}
					</Reveal>
					<Reveal
						delay={300}
						className="mt-9 flex flex-col gap-3 sm:flex-row"
					>
						<Link
							to="/order"
							className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-cream px-8 text-[15px] font-medium text-cocoa hover:bg-white"
						>
							Tạo món quà của bạn{" "}
							<ArrowRight aria-hidden className="h-4 w-4" />
						</Link>
						<a
							href={
								CONTACT.zalo
									? `https://zalo.me/${CONTACT.zalo}`
									: `mailto:${CONTACT.email}`
							}
							className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-cream/50 px-8 text-[15px] font-medium text-cream hover:bg-cream/10"
						>
							Liên hệ với Chạm
						</a>
					</Reveal>
					{note && (
						<Reveal
							delay={400}
							className="mt-5 text-[14px] text-cream/75"
						>
							{note}
						</Reveal>
					)}
				</div>
				<Reveal
					delay={200}
					className="flex items-center gap-4 lg:flex-col"
				>
					<div className="bg-white p-2">
						{qr ? (
							<img
								src={qr}
								alt="Mã QR liên hệ Chạm"
								className="h-[clamp(84px,8vw,120px)] w-[clamp(84px,8vw,120px)]"
							/>
						) : (
							<div className="h-[84px] w-[84px]" />
						)}
					</div>
					<p className="text-[13px] text-cream/80">
						Quét để nhắn cho Chạm
					</p>
				</Reveal>
			</div>
		</section>
	);
}

/** Kiểu chuyển động 4: chữ "chạm" cỡ lớn được "viết" dần từ trái sang phải khi cuộn tới cuối trang. */
export function V2Footer({
	logoSrc = logo,
	logoW = 629,
	logoH = 230,
	tagline = "LƯU GIỮ ĐIỀU QUAN TRỌNG",
}: {
	logoSrc?: string;
	logoW?: number;
	logoH?: number;
	tagline?: string;
} = {}) {
	const { ref, shown } = useInView<HTMLDivElement>(0.3);
	const ig = CONTACT.social.find((s) => s.label === "Instagram")?.url ?? "#";
	const tt = CONTACT.social.find((s) => s.label === "TikTok")?.url ?? "#";
	return (
		<footer className="overflow-hidden bg-[#F7F1E7] pt-16 lg:pt-[6vw]">
			<div className="lwrap">
				<div ref={ref}>
					<img
						data-shown={shown}
						src={logoSrc}
						alt="Chạm"
						width={logoW}
						height={logoH}
						className="v2-write mx-auto h-auto w-[min(78vw,880px)]"
					/>
				</div>
				<p className="mt-4 text-center text-[11px] tracking-[0.3em] text-cocoa-soft">
					{tagline}
				</p>
				<div className="mt-12 flex flex-col items-center gap-4 border-t border-taupe/40 py-6 text-[14px] text-cocoa/80 sm:flex-row sm:justify-between">
					<div className="flex items-center gap-6">
						<a
							href={ig}
							className="inline-flex min-h-[44px] items-center gap-2 hover:text-cocoa"
						>
							<AtSign aria-hidden className="h-4 w-4" />
							Instagram
						</a>
						<a
							href={tt}
							className="inline-flex min-h-[44px] items-center gap-2 hover:text-cocoa"
						>
							<Music2 aria-hidden className="h-4 w-4" />
							TikTok
						</a>
						<a
							href={`mailto:${CONTACT.email}`}
							className="inline-flex min-h-[44px] items-center gap-2 hover:text-cocoa"
						>
							<Mail aria-hidden className="h-4 w-4" />
							Email
						</a>
						{CONTACT.zalo && (
							<a
								href={`https://zalo.me/${CONTACT.zalo}`}
								className="inline-flex min-h-[44px] items-center gap-2 hover:text-cocoa"
							>
								<MessageCircle
									aria-hidden
									className="h-4 w-4"
								/>
								Zalo
							</a>
						)}
					</div>
					<span className="text-cocoa-soft">© Chạm</span>
				</div>
			</div>
		</footer>
	);
}
