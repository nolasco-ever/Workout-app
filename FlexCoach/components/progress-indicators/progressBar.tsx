import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors } from '../../colors'
import { animated, useSpring } from '@react-spring/native'

type ProgressBarProps = {
    title?: string,
    percent: number,
    showPercent?: boolean
    setProgressCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  }

export const ProgressBar = ({title, percent=0.50, showPercent=true, setProgressCompleted}: ProgressBarProps) => {
    const appColors = colors();
    
    const [prevFill, setPrevFill] = useState<string>('0%');
    const [currentFill, setCurrentFill] = useState<string>(`${Math.round(percent*100)}%`)
    // const fill = `${Math.round(percent*100)}%`

    const onIncreaseStyle = () => {
        return useSpring({
            width: currentFill,

            from: {
                width: prevFill
            },

            config: {
                mass: 1,
                tension: 100,
                friction: 20
            }
        })
    }

    useEffect(() => {
        setPrevFill(currentFill);
        setCurrentFill(Math.round(percent*100) > 100 ? '100%' : `${Math.round(percent*100)}%`);

        if (percent > 1) {
            setTimeout(() => {
                setProgressCompleted(true)
            }, 500)
        }
    }, [percent])

  return (
    <View style={[styles.container]}>
      {title && <Text style={[styles.bodyText, { fontWeight: '700', color:appColors.text}]}>{title}</Text>}
      <View style={[styles.barContainer, {backgroundColor: appColors.inactive}]}>
        <animated.View 
            style={[
                styles.fillBar, 
                {
                    width: currentFill, 
                    backgroundColor: percent < 1 ? appColors.secondary : 'green'
                },
                onIncreaseStyle()
            ]}
        />
      </View>

      {showPercent ? 
        <View>
          <Text style={[styles.bodyText, {color: appColors.text}]}>{currentFill}</Text>
        </View>  
        : null
      }
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    barContainer: {
        width: '100%',
        borderRadius: 10,
        margin: 10
    },
    fillBar: {
        height: 10,
        borderRadius: 5
    },
    bodyText: {
        fontSize: 16,
    },
})