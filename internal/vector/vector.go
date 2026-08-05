package vector

import (
	"encoding/binary"
	"math"
)

// Float32SliceToBytes converts a slice of float32 to a byte slice using LittleEndian order.
func Float32SliceToBytes(slice []float32) []byte {
	buf := make([]byte, len(slice)*4)
	for i, f := range slice {
		binary.LittleEndian.PutUint32(buf[i*4:], math.Float32bits(f))
	}
	return buf
}

// BytesToFloat32Slice converts a byte slice back to a slice of float32.
func BytesToFloat32Slice(buf []byte) []float32 {
	if len(buf)%4 != 0 {
		return nil
	}
	slice := make([]float32, len(buf)/4)
	for i := range slice {
		bits := binary.LittleEndian.Uint32(buf[i*4:])
		slice[i] = math.Float32frombits(bits)
	}
	return slice
}

// CosineSimilarity computes the cosine similarity between two float32 vectors.
func CosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) || len(a) == 0 {
		return 0.0
	}

	var dotProduct float32
	var normA float32
	var normB float32

	for i := 0; i < len(a); i++ {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0.0
	}

	return dotProduct / (float32(math.Sqrt(float64(normA))) * float32(math.Sqrt(float64(normB))))
}
