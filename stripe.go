package main

import (
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/stripe/stripe-go/v80"
	"github.com/stripe/stripe-go/v80/checkout/session"
	"net/http"
)

func NewStripe(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		stripe.Key = d.Config.Stripe.SecretKey

		sessionParams := &stripe.CheckoutSessionParams{
			PaymentMethodTypes: stripe.StringSlice([]string{"card"}),
			LineItems: []*stripe.CheckoutSessionLineItemParams{
				{
					PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
						Currency: stripe.String("usd"),
						ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
							Name: stripe.String("Sample Product"),
						},
						UnitAmount: stripe.Int64(2000), // $20.00 in cents
					},
					Quantity: stripe.Int64(1),
				},
			},
			Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
			SuccessURL: stripe.String("/stripe/success"),
			CancelURL:  stripe.String("/stripe/cancel"),
		}

		sess, err := session.New(sessionParams)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, sess.URL, http.StatusSeeOther)
	})
	mux.HandleFunc("/success", func(w http.ResponseWriter, r *http.Request) {
		Div(
			H1(T("Success Page")),
			P(T("Payment successful!")),
		).RenderPage(w, r)
	})
	mux.HandleFunc("/cancel", func(w http.ResponseWriter, r *http.Request) {
		Div(
			H1(T("Cancel Page")),
			P(T("Payment canceled.")),
		).RenderPage(w, r)
	})
	return mux
}
