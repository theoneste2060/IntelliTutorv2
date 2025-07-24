
import base64
import struct

def create_simple_png(width, height, color_rgb):
    # Create a simple PNG file with solid color
    def write_png_chunk(chunk_type, data):
        chunk_data = chunk_type + data
        crc = 0xffffffff
        for byte in chunk_data:
            if isinstance(byte, str):
                byte = ord(byte)
            crc ^= byte
            for _ in range(8):
                if crc & 1:
                    crc = (crc >> 1) ^ 0xedb88320
                else:
                    crc >>= 1
        crc ^= 0xffffffff
        return struct.pack('>I', len(data)) + chunk_data + struct.pack('>I', crc & 0xffffffff)
    
    # PNG signature
    png_data = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png_data += write_png_chunk(b'IHDR', ihdr_data)
    
    # Create image data (simple solid color)
    row_data = bytes([color_rgb[0], color_rgb[1], color_rgb[2]] * width)
    image_data = b''
    for y in range(height):
        image_data += b'\x00' + row_data  # Filter type 0 (None)
    
    # Compress image data
    import zlib
    compressed_data = zlib.compress(image_data)
    png_data += write_png_chunk(b'IDAT', compressed_data)
    
    # IEND chunk
    png_data += write_png_chunk(b'IEND', b'')
    
    return png_data

# Create blue icon (IntelliTutor brand color)
icon_192 = create_simple_png(192, 192, (59, 130, 246))  # #3B82F6
icon_512 = create_simple_png(512, 512, (59, 130, 246))

with open('icon-192.png', 'wb') as f:
    f.write(icon_192)

with open('icon-512.png', 'wb') as f:
    f.write(icon_512)

print('Icons created successfully')

