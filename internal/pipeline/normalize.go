package pipeline

import (
	"crypto/sha256"
	"encoding/hex"
	"net/url"
	"sort"
	"strings"
)

var trackingParams = map[string]struct{}{
	"fbclid":       {},
	"gclid":        {},
	"mc_cid":       {},
	"mc_eid":       {},
	"ref":          {},
	"source":       {},
	"utm_id":       {},
	"utm_name":     {},
	"utm_medium":   {},
	"utm_source":   {},
	"utm_campaign": {},
	"utm_term":     {},
	"utm_content":  {},
}

func NormalizeURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	parsed, err := url.Parse(raw)
	if err != nil {
		return raw
	}

	if parsed.Scheme == "" {
		parsed.Scheme = "https"
	}
	parsed.Scheme = strings.ToLower(parsed.Scheme)
	parsed.Host = strings.ToLower(parsed.Host)
	parsed.Fragment = ""

	values := parsed.Query()
	filtered := make(url.Values, len(values))
	keys := make([]string, 0, len(values))
	for key := range values {
		if _, skip := trackingParams[strings.ToLower(key)]; skip || strings.HasPrefix(strings.ToLower(key), "utm_") {
			continue
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)
	for _, key := range keys {
		filtered[key] = append([]string(nil), values[key]...)
	}
	parsed.RawQuery = filtered.Encode()

	return parsed.String()
}

func hashString(parts ...string) string {
	h := sha256.New()
	for _, part := range parts {
		_, _ = h.Write([]byte(part))
		_, _ = h.Write([]byte{0})
	}
	return hex.EncodeToString(h.Sum(nil))
}

func appendUnique(values []string, value string) []string {
	for _, existing := range values {
		if existing == value {
			return values
		}
	}
	return append(values, value)
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func cloneMap(src map[string]interface{}) map[string]interface{} {
	if src == nil {
		return nil
	}

	out := make(map[string]interface{}, len(src))
	for key, value := range src {
		out[key] = value
	}
	return out
}
