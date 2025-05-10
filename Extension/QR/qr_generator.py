try:
    import qrcode
    from PIL import Image
    LIBRARIES_AVAILABLE = True
except ImportError:
    LIBRARIES_AVAILABLE = False
    print("Required libraries not found. Installing them...")

import argparse
import os
import sys
import subprocess

def install_required_libraries():
    """Install the required libraries if they're not available"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "qrcode[pil]"])
        print("Required libraries installed successfully.")
        return True
    except Exception as e:
        print(f"Failed to install required libraries: {e}")
        return False

def generate_qr_code(data, output_file="qrcode.png", size=10, border=4):
    """
    Generate a QR code from the given data
    
    Parameters:
    data (str): The data to encode in the QR code
    output_file (str): The filename to save the QR code image
    size (int): The size of the QR code (1 to 40)
    border (int): The size of the border around the QR code
    
    Returns:
    str: Path to the generated QR code image
    """
    # Only try to import libraries again if they weren't available initially
    if not 'qrcode' in sys.modules:
        try:
            global qrcode, Image
            import qrcode
            from PIL import Image
        except ImportError:
            print("Error: Required libraries are still not available.")
            return None
    
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=size,
            border=border,
        )
        
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img.save(output_file)
        
        return output_file
    except Exception as e:
        print(f"Error generating QR code: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Generate QR code from URL or text')
    parser.add_argument('data', help='URL or text to encode in QR code')
    parser.add_argument('-o', '--output', default='qrcode.png', help='Output file name')
    parser.add_argument('-s', '--size', type=int, default=10, help='QR code size')
    parser.add_argument('-b', '--border', type=int, default=4, help='QR code border size')
    
    args = parser.parse_args()
    
    # Check if required libraries are available, install if not
    if not LIBRARIES_AVAILABLE and not install_required_libraries():
        print("Error: Could not install required libraries. Please install them manually:")
        print("pip install qrcode[pil]")
        sys.exit(1)
    
    output_path = generate_qr_code(args.data, args.output, args.size, args.border)
    
    if output_path:
        print(f"QR code generated successfully: {os.path.abspath(output_path)}")
    else:
        print("Failed to generate QR code.")
        sys.exit(1)

if __name__ == "__main__":
    main()