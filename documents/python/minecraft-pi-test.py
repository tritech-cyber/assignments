from mcpi.minecraft import Minecraft
from mcpi import block
from   time import sleep

def init():
 #ipString = "192.168.1.73"
 ipString = "127.0.0.1"
 #mc = Minecraft.create("127.0.0.1", 4711)
 mc = Minecraft.create(ipString, 4711)
 mc.setting("world_immutable",True)
 #x, y, z = mc.player.getPos()
 return mc

def one(mc,x,y,z):
 print("FUNCTION ONE")
 mc.setBlock(x,y, z, block.IRON_BLOCK.id)

def two(mc,x,y,z):
 print("FUNCTION TWO")
 mc.setBlocks(x-10,y,z+1,x+10,y+10,z+1+10,35,7)
def three(mc,x,y,z):
 print("FUNCTION THREE")
 mc.setBlocks(x-10,y,z+1,x+10,y+10,z+1+10,35,3)
 mc.setBlocks(x-10,y,z+1,x+10,y+10,z+1+10,35,9)

def main():
 mc = init()
 x,y,z = mc.player.getPos()
 mc.player.setPos(x,y,z)
 one(mc,x,y,z)
 two(mc,x,y+5,z)
 three(mc,x,y+10,z)
 mc.player.setPos(x,y+50,z-2)

if __name__ == "__main__":
 main()
