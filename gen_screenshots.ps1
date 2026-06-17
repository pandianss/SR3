Add-Type -AssemblyName System.Drawing
$W=1080; $H=1920
$BG1=[System.Drawing.ColorTranslator]::FromHtml('#0B1929')
$BG2=[System.Drawing.ColorTranslator]::FromHtml('#0E2138')
$CARD=[System.Drawing.ColorTranslator]::FromHtml('#16304F')
$BORD=[System.Drawing.ColorTranslator]::FromHtml('#274869')
$GOLD=[System.Drawing.ColorTranslator]::FromHtml('#E9A020')
$WHITE=[System.Drawing.ColorTranslator]::FromHtml('#F1F5F9')
$MUTED=[System.Drawing.ColorTranslator]::FromHtml('#94A8C0')
$GREEN=[System.Drawing.ColorTranslator]::FromHtml('#2ECC71')
$GREENBG=[System.Drawing.ColorTranslator]::FromHtml('#14352A')
$GOLDBG=[System.Drawing.ColorTranslator]::FromHtml('#3A2E12')

function NewG {
  $bmp=New-Object System.Drawing.Bitmap $script:W,$script:H
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode='AntiAlias'; $g.InterpolationMode='HighQualityBicubic'; $g.TextRenderingHint='ClearTypeGridFit'
  $r=New-Object System.Drawing.Rectangle 0,0,$script:W,$script:H
  $grad=New-Object System.Drawing.Drawing2D.LinearGradientBrush $r,$script:BG1,$script:BG2,90
  $g.FillRectangle($grad,$r)
  return @($bmp,$g)
}
function RR($g,$x,$y,$w,$h,$rad,$col){
  $p=New-Object System.Drawing.Drawing2D.GraphicsPath; $d=$rad*2
  $p.AddArc($x,$y,$d,$d,180,90); $p.AddArc($x+$w-$d,$y,$d,$d,270,90)
  $p.AddArc($x+$w-$d,$y+$h-$d,$d,$d,0,90); $p.AddArc($x,$y+$h-$d,$d,$d,90,90); $p.CloseFigure()
  $b=New-Object System.Drawing.SolidBrush $col; $g.FillPath($b,$p); $b.Dispose()
  return $p
}
function RRB($g,$x,$y,$w,$h,$rad,$col,$bcol,$bw){
  $p=RR $g $x $y $w $h $rad $col
  $pen=New-Object System.Drawing.Pen $bcol,$bw; $g.DrawPath($pen,$p); $pen.Dispose(); $p.Dispose()
}
function F($size,$style='Regular'){ New-Object System.Drawing.Font 'Segoe UI',$size,([System.Drawing.FontStyle]::$style) }
function T($g,$text,$font,$col,$x,$y){ $b=New-Object System.Drawing.SolidBrush $col; $g.DrawString($text,$font,$b,[float]$x,[float]$y); $b.Dispose() }
function TW($g,$text,$font,$col,$x,$y,$w,$h){ $b=New-Object System.Drawing.SolidBrush $col; $rf=New-Object System.Drawing.RectangleF $x,$y,$w,$h; $g.DrawString($text,$font,$b,$rf); $b.Dispose() }
function Header($g,$kicker,$title){
  T $g 'SuperRecall' (F 26 'Bold') $script:GOLD 60 70
  T $g $kicker (F 22 'Regular') $script:MUTED 60 112
  T $g $title (F 46 'Bold') $script:WHITE 60 150
}
function Save($bmp,$name){ $bmp.Save((Join-Path (Get-Location) "resources\$name"),[System.Drawing.Imaging.ImageFormat]::Png) }

# Screen 1: Microlesson
$a=NewG; $bmp=$a[0]; $g=$a[1]
Header $g 'BFM - Module B - Risk - 3 min read' 'Basel III Framework'
RRB $g 60 250 960 360 24 $CARD $BORD 2
T $g 'CAPITAL ADEQUACY and BUFFERS' (F 20 'Bold') $GOLD 95 285
TW $g 'Basel III sets the minimum capital banks must hold to absorb unexpected losses, via Tier 1 and Tier 2 capital plus regulatory buffers.' (F 26 'Regular') $WHITE 95 330 890 150
RR $g 95 510 890 72 14 $GOLDBG | Out-Null
T $g 'CET1 5.5%   |   Tier 1 7.0%   |   Total 9.0%   |   +CCB 11.5%' (F 23 'Bold') $GOLD 120 532
$pw=300; $titles=@('Pillar 1','Pillar 2','Pillar 3'); $descs=@('Minimum capital for credit, market and operational risk','Supervisory review (ICAAP) of bank-wide risks','Market discipline through public disclosure')
for($i=0;$i -lt 3;$i++){
  $x=60+$i*320
  RRB $g $x 660 $pw 300 20 $CARD $BORD 2
  T $g $titles[$i] (F 24 'Bold') $WHITE ($x+25) 690
  TW $g $descs[$i] (F 21 'Regular') $MUTED ($x+25) 745 ($pw-50) 200
}
RRB $g 60 1020 960 220 24 $GREENBG $GREEN 2
T $g 'QUICK CHECK' (F 20 'Bold') $GREEN 95 1050
TW $g 'Minimum CRAR for scheduled commercial banks in India (excluding buffers)?' (F 26 'Bold') $WHITE 95 1090 890 90
T $g 'Answer: 9.0%' (F 30 'Bold') $GREEN 95 1175
T $g 'Tap to continue ->' (F 26 'Bold') $GOLD 60 1760
Save $bmp 'screenshot-1.png'; $g.Dispose(); $bmp.Dispose()

# Screen 2: Practice Quiz
$a=NewG; $bmp=$a[0]; $g=$a[1]
Header $g 'Practice - ABM - Credit Management' 'Question 7 of 15'
RRB $g 60 250 960 230 24 $CARD $BORD 2
TW $g 'A Doubtful-1 (D1) account has dues of Rs 10 Cr with realisable security of Rs 4 Cr. What is the TOTAL provision required?' (F 30 'Bold') $WHITE 95 285 890 180
$opts=@('Rs 1 Cr','Rs 7 Cr','Rs 10 Cr','Rs 4 Cr'); $correct=1
for($i=0;$i -lt 4;$i++){
  $y=520+$i*150
  if($i -eq $correct){
    RRB $g 60 $y 960 120 20 $GREENBG $GREEN 3
    $pen=New-Object System.Drawing.Pen $GREEN,7; $pen.StartCap='Round'; $pen.EndCap='Round'
    $g.DrawLines($pen, @((New-Object System.Drawing.Point 100,($y+62)),(New-Object System.Drawing.Point 122,($y+84)),(New-Object System.Drawing.Point 160,($y+40))))
    $pen.Dispose()
  } else {
    RRB $g 60 $y 960 120 20 $CARD $BORD 2
    T $g ([string][char](65+$i)) (F 26 'Bold') $GOLD 100 ($y+40)
  }
  T $g $opts[$i] (F 30 'Regular') $WHITE 195 ($y+38)
}
RRB $g 60 1140 960 360 24 $CARD $BORD 2
T $g 'WHY' (F 22 'Bold') $GOLD 95 1170
TW $g 'D1 provisioning: secured portion (Rs 4 Cr) at 25% = Rs 1 Cr; unsecured portion (Rs 6 Cr) at 100% = Rs 6 Cr. Total = Rs 7 Cr. The unsecured part of every Doubtful asset attracts 100% provision regardless of D1/D2/D3.' (F 25 'Regular') $WHITE 95 1215 890 270
T $g 'Streak: 14 days    -    XP +20' (F 26 'Bold') $MUTED 60 1760
Save $bmp 'screenshot-2.png'; $g.Dispose(); $bmp.Dispose()

# Screen 3: Exam Readiness
$a=NewG; $bmp=$a[0]; $g=$a[1]
Header $g 'Your progress' 'Exam Readiness'
RRB $g 60 250 960 300 24 $CARD $BORD 2
T $g '72%' (F 96 'Bold') $GOLD 110 290
T $g 'On track' (F 30 'Bold') $GREEN 130 470
T $g 'Aggregate across your 4 papers' (F 24 'Regular') $MUTED 440 360
T $g 'Keep a 5-day streak to reach 80%' (F 22 'Regular') $MUTED 440 410
$subs=@(@('ABM',78,'#2DD4BF'),@('BFM',65,'#60A5FA'),@('ABFM',70,'#FB923C'),@('BRBL',80,'#A78BFA'))
$y=600
foreach($s in $subs){
  $col=[System.Drawing.ColorTranslator]::FromHtml($s[2])
  T $g $s[0] (F 30 'Bold') $WHITE 70 ($y+14)
  RR $g 260 ($y+22) 640 36 18 $CARD | Out-Null
  RR $g 260 ($y+22) ([int](640*$s[1]/100)) 36 18 $col | Out-Null
  T $g ("{0}%" -f $s[1]) (F 28 'Bold') $WHITE 930 ($y+10)
  $y+=110
}
RRB $g 60 1090 960 200 24 $GREENBG $GREEN 2
T $g 'Study streak: 14 days' (F 32 'Bold') $WHITE 95 1130
T $g 'Best paper: BRBL  -  Focus next: BFM' (F 25 'Regular') $MUTED 95 1190
RRB $g 60 1330 960 180 24 $CARD $BORD 2
T $g 'Daily goal' (F 26 'Bold') $WHITE 95 1360
T $g '12 / 15 cards' (F 36 'Bold') $GOLD 95 1410
Save $bmp 'screenshot-3.png'; $g.Dispose(); $bmp.Dispose()

# Screen 4: AI Coach / Premium
$a=NewG; $bmp=$a[0]; $g=$a[1]
Header $g 'Premium' 'AI Coach'
RRB $g 60 250 960 430 24 $CARD $BORD 2
T $g 'CASE STUDY - Capital Adequacy' (F 22 'Bold') $GOLD 95 285
TW $g 'Bank Beta has RWA of Rs 2,000 Cr, CET1 of Rs 130 Cr, Additional Tier 1 of Rs 30 Cr and Tier 2 of Rs 50 Cr. Is it Basel III compliant?' (F 27 'Regular') $WHITE 95 330 890 150
TW $g 'CET1 = 6.5% (min 5.5%)   Tier 1 = 8.0% (min 7%)   CRAR = 10.5% (min 9%)' (F 24 'Bold') $GREEN 95 500 890 120
T $g 'Result: Compliant under RBI norms' (F 28 'Bold') $GREEN 95 620
$feats=@('Instant AI explanations for every wrong answer','Personalised study strategy across your papers','AI-generated case studies and numerical drills')
$y=730
foreach($f in $feats){ T $g '*' (F 30 'Bold') $GOLD 70 ($y-4); TW $g $f (F 27 'Regular') $WHITE 115 ($y+2) 900 70; $y+=90 }
$plans=@(@('Monthly','Rs 149'),@('3 Months','Rs 349'),@('Yearly','Rs 999'))
for($i=0;$i -lt 3;$i++){
  $x=60+$i*320
  if($i -eq 1){ RRB $g $x 1040 300 220 20 $GOLDBG $GOLD 3 } else { RRB $g $x 1040 300 220 20 $CARD $BORD 2 }
  T $g $plans[$i][0] (F 24 'Bold') $MUTED ($x+25) 1070
  T $g $plans[$i][1] (F 36 'Bold') $WHITE ($x+25) 1115
  if($i -eq 1){ T $g 'Most Popular' (F 19 'Bold') $GOLD ($x+25) 1195 }
}
RR $g 60 1330 960 110 24 $GOLD | Out-Null
T $g 'Unlock Premium' (F 34 'Bold') $BG1 380 1352
T $g 'Cancel anytime in Google Play' (F 22 'Regular') $MUTED 60 1470
Save $bmp 'screenshot-4.png'; $g.Dispose(); $bmp.Dispose()

'generated:'
Get-ChildItem resources\screenshot-*.png | ForEach-Object { $im=[System.Drawing.Image]::FromFile($_.FullName); ('{0} {1}x{2} {3}KB' -f $_.Name,$im.Width,$im.Height,[math]::Round($_.Length/1KB,1)); $im.Dispose() }
