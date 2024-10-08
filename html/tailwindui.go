package html

func RenderPricingPage() *Node {
	return Div(Class("bg-white py-24 sm:py-32"),
		Div(Class("mx-auto max-w-7xl px-6 lg:px-8"),
			Div(Class("mx-auto max-w-2xl sm:text-center"),
				H2(Class("text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"), T("Simple kicks pricing")),
				P(Class("mt-6 text-lg leading-8 text-gray-600"), T("Distinctio et nulla eum soluta et neque labore quibusdam. Saepe et quasi iusto modi velit ut non voluptas in. Explicabo id ut laborum.")),
			),
			Div(Class("mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none"),
				Div(Class("p-8 sm:p-10 lg:flex-auto"),
					H3(Class("text-2xl font-bold tracking-tight text-gray-900"), T("Death membership")),
					P(Class("mt-6 text-base leading-7 text-gray-600"), T("Lorem ipsum dolor sit amet consect etur adipisicing elit. Itaque amet indis perferendis blanditiis repellendus etur quidem assumenda.")),
					Div(Class("mt-10 flex items-center gap-x-4"),
						H4(Class("flex-none text-sm font-semibold leading-6 text-indigo-600"), T("What’s included")),
						Div(Class("h-px flex-auto bg-gray-100")),
					),
					Ul(Class("mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), Attr("viewBox", "0 0 20 20"), Attr("fill", "currentColor"),
								Path(Attr("fill-rule", "evenodd"), Attr("d", "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"), Attr("clip-rule", "evenodd")),
							),
							T("Private forum access"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), Attr("viewBox", "0 0 20 20"), Attr("fill", "currentColor"),
								Path(Attr("fill-rule", "evenodd"), Attr("d", "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"), Attr("clip-rule", "evenodd")),
							),
							T("Member resources"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), Attr("viewBox", "0 0 20 20"), Attr("fill", "currentColor"),
								Path(Attr("fill-rule", "evenodd"), Attr("d", "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"), Attr("clip-rule", "evenodd")),
							),
							T("Entry to annual conference"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), Attr("viewBox", "0 0 20 20"), Attr("fill", "currentColor"),
								Path(Attr("fill-rule", "evenodd"), Attr("d", "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"), Attr("clip-rule", "evenodd")),
							),
							T("Official member t-shirt"),
						),
					),
				),
				Div(Class("-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0"),
					Div(Class("rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16"),
						Div(Class("mx-auto max-w-xs px-8"),
							P(Class("text-base font-semibold text-gray-600"), T("Pay once, own it forever")),
							P(Class("mt-6 flex items-baseline justify-center gap-x-2"),
								Span(Class("text-5xl font-bold tracking-tight text-gray-900"), T("$349")),
								Span(Class("text-sm font-semibold leading-6 tracking-wide text-gray-600"), T("USD")),
							),
							A(Href("#"), Class("mt-10 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"), T("Get access")),
							P(Class("mt-6 text-xs leading-5 text-gray-600"), T("Invoices and receipts available for easy company reimbursement")),
						),
					),
				),
			),
		),
	)
}

func RenderLanding() *Node {
	return Div(
		Id("app"),
		Div(
			Class("overflow-hidden"),
			Div(
				Class("bg-white"),
				Header(
					Class("absolute inset-x-0 top-0 z-50"),
					Nav(
						AriaLabel("Global"),
						Class("flex items-center justify-between p-6 lg:px-8"),
						Div(
							Class("flex lg:flex-1"),
							A(
								Href("#"),
								Class("-m-1.5 p-1.5"),
								Span(Class("sr-only"), Text("Your Company")),
								Img(
									Src(
										"https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=600",
									),
									Class("h-8 w-auto"),
								),
							),
						),
						Div(
							Class("flex lg:hidden"),
							Button(
								Type("button"),
								Class(
									"-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700",
								),
								Span(Class("sr-only"), Text("Open main menu")),
								Svg(
									ViewBox("0 0 24 24"),
									StrokeWidth("1.5"),
									Stroke("currentColor"),
									AriaHidden("true"),
									Class("h-6 w-6"),
									Xmlns("http://www.w3.org/2000/svg"),
									Fill("none"),
									Path(
										StrokeLinecap("round"),
										StrokeLinejoin("round"),
										D("M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"),
									),
								),
							),
						),
						Div(
							Class("hidden lg:flex lg:gap-x-12"),
							A(
								Class("text-sm font-semibold leading-6 text-gray-900"),
								Href("#"),
								Text("Product"),
							),
							A(
								Href("#"),
								Class("text-sm font-semibold leading-6 text-gray-900"),
								Text("Features"),
							),
							A(
								Href("#"),
								Class("text-sm font-semibold leading-6 text-gray-900"),
								Text("Marketplace"),
							),
							A(
								Href("#"),
								Class("text-sm font-semibold leading-6 text-gray-900"),
								Text("Company"),
							),
						),
						Div(
							Class("hidden lg:flex lg:flex-1 lg:justify-end"),
							A(
								Href("#"),
								Class("text-sm font-semibold leading-6 text-gray-900"),
								Text("Log in"),
								Span(AriaHidden("true"), Text("→")),
							),
						),
					),
				),
				Div(
					Class("relative isolate px-6 pt-14 lg:px-8"),
					Div(
						AriaHidden("true"),
						Class(
							"absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80",
						),
						Div(
							Class(
								"relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]",
							),
							Style(
								T("clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%);"),
							),
						),
					),
					Div(
						Class("mx-auto max-w-2xl py-32 sm:py-48 lg:py-56"),
						Div(
							Class("hidden sm:mb-8 sm:flex sm:justify-center"),
							Div(
								Class(
									"relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20",
								),
								Text("Announcing our next round of funding."),
								A(
									Href("#"),
									Class("font-semibold text-indigo-600"),
									Span(AriaHidden("true"), Class("absolute inset-0")),
									Text("Read more"),
									Span(AriaHidden("true"), Text("→")),
								),
							),
						),
						Div(
							Class("text-center"),
							H1(
								Class(
									"text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl",
								),
								Text("Data to enrich your online business"),
							),
							P(
								Class("mt-6 text-lg leading-8 text-gray-600"),
								Text(
									"Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat fugiat aliqua.",
								),
							),
							Div(
								Class("mt-10 flex items-center justify-center gap-x-6"),
								A(
									Href("#"),
									Class(
										"rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
									),
									Text("Get started"),
								),
								A(
									Href("#"),
									Class("text-sm font-semibold leading-6 text-gray-900"),
									Text("Learn more"),
									Span(AriaHidden("true"), Text("→")),
								),
							),
						),
					),
					Div(
						AriaHidden("true"),
						Class(
							"absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]",
						),
						Div(
							Class(
								"relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]",
							),
							Style(
								T("clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%);"),
							),
						),
					),
				),
			),
		),
	)
}
