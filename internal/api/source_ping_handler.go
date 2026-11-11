package api

import (
	"context"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type pingRequest struct {
	URL string `json:"url"`
}

type pingResponse struct {
	URL    string `json:"url"`
	Online bool   `json:"online"`
	Status int    `json:"status"`
}

func isSafeTargetURL(targetURL string) error {
	parsed, err := url.ParseRequestURI(targetURL)
	if err != nil {
		return errors.New("invalid url")
	}
	scheme := strings.ToLower(parsed.Scheme)
	if scheme != "http" && scheme != "https" {
		return errors.New("scheme must be http or https")
	}
	hostname := parsed.Hostname()
	if hostname == "" {
		return errors.New("missing hostname")
	}

	ips, err := net.LookupIP(hostname)
	if err != nil {
		return errors.New("failed to resolve host")
	}
	if len(ips) == 0 {
		return errors.New("no IP addresses resolved")
	}

	for _, ip := range ips {
		if isBlockedIP(ip) {
			return errors.New("blocked IP address")
		}
	}
	return nil
}

func isBlockedIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() || ip.IsInterfaceLocalMulticast() ||
		ip.IsMulticast() || ip.IsUnspecified() {
		return true
	}
	if ip4 := ip.To4(); ip4 != nil {
		// 169.254.0.0/16 is link-local / cloud metadata (handled by IsLinkLocalUnicast, explicitly checked for defense-in-depth)
		if ip4[0] == 169 && ip4[1] == 254 {
			return true
		}
		// 100.64.0.0/10 (CGNAT / Shared Address Space)
		if ip4[0] == 100 && (ip4[1]&0xc0) == 64 {
			return true
		}
	}
	return false
}

func newSafeTransport() *http.Transport {
	dialer := &net.Dialer{
		Timeout: 3 * time.Second,
	}
	return &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			host, _, err := net.SplitHostPort(addr)
			if err != nil {
				return nil, err
			}
			ips, err := (&net.Resolver{}).LookupIP(ctx, "ip", host)
			if err != nil {
				return nil, err
			}
			for _, ip := range ips {
				if isBlockedIP(ip) {
					return nil, errors.New("blocked IP address")
				}
			}
			return dialer.DialContext(ctx, network, addr)
		},
	}
}

func (a *API) HandleSourcePing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req pingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		http.Error(w, "URL is required", http.StatusBadRequest)
		return
	}

	if err := isSafeTargetURL(req.URL); err != nil {
		http.Error(w, "Forbidden URL or target host", http.StatusBadRequest)
		return
	}

	client := &http.Client{
		Timeout:   3500 * time.Millisecond,
		Transport: newSafeTransport(),
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return errors.New("stopped after 10 redirects")
			}
			return isSafeTargetURL(req.URL.String())
		},
	}

	reqHead, err := http.NewRequestWithContext(r.Context(), "HEAD", req.URL, nil)
	online := false
	statusCode := 0

	if err == nil {
		reqHead.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		reqHead.Header.Set("Accept", "*/*")
		resp, headErr := client.Do(reqHead)
		if headErr == nil {
			statusCode = resp.StatusCode
			online = (resp.StatusCode >= 200 && resp.StatusCode < 400)
			resp.Body.Close()
		}
	}

	if !online {
		reqGet, getErr := http.NewRequestWithContext(r.Context(), "GET", req.URL, nil)
		if getErr == nil {
			reqGet.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
			reqGet.Header.Set("Accept", "*/*")
			reqGet.Header.Set("Range", "bytes=0-1024")
			resp, doErr := client.Do(reqGet)
			if doErr == nil {
				statusCode = resp.StatusCode
				online = (resp.StatusCode >= 200 && resp.StatusCode < 500)
				resp.Body.Close()
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pingResponse{
		URL:    req.URL,
		Online: online,
		Status: statusCode,
	})
}
